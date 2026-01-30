import React, { useState, useEffect } from "react";
import { Table, Button, Tooltip, message } from "antd";
import {
  FilePdfOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import AddExpensesModal from "../WorkerModals/AddExpensesModal";
import ViewExpensesModal from "../WorkerModals/ViewExpensesModal";
import EditExpensesModal from "../WorkerModals/EditExpensesModal";
import ExpensesFilterModal from "../WorkerModals/ExpensesFilterModal";

// ====================== Styled Components ======================
const StyledContainer = styled.div`
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease;
  margin: 0 auto;
  box-sizing: border-box;

  .dark & {
    background-color: #001f3f;
    color: white;
  }

  @media (max-width: 1024px) {
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
    padding: 16px;
    box-shadow: none;
    overflow-x: hidden;
  }

  @media (max-width: 768px) {
    padding: 12px;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
`;

const StyledTable = styled(Table)`
  width: 100%;

  .ant-table {
    width: 100%;
  }

  .ant-table-content {
    width: 100%;
    min-width: 0 !important;
    overflow-x: auto;
  }

  .ant-table-thead > tr > th {
    background: #f9fafb;
    font-weight: bold;
    color: #374151;
  }

  tr:hover td {
    background-color: #f9fafb !important;
  }

  @media (max-width: 1024px) {
    font-size: 13px;
    margin-top: 16px;
  }

  @media (max-width: 768px) {
    font-size: 12px;
    margin-top: 20px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    margin-top: 24px;
  }
`;

const ActionButton = styled(Button)`
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  &:hover {
    transform: scale(1.05);
  }
`;

// ====================== INTERFACE ======================
interface ExpenseItem {
  key: string;
  expenses_id: number;
  expense_date: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  method: string;
  receipt_no: string;
  remarks: string;
  created_by: number;
}

// ===============================================================
const WorkerManageExpenses: React.FC = () => {
  const today = dayjs();
  const firstDayOfMonth = today.startOf("month");

  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    firstDayOfMonth,
    today,
  ]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseItem[]>([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const currentUserId = Number(sessionStorage.getItem("user_id"));

  // ================== Fetch Expenses with optional date filter ==================
  const fetchExpenses = async (start?: string, end?: string) => {
    try {
      const params: any = {};
      if (start && end) {
        params.start = start;
        params.end = end;
      }
      const res = await axios.get(`${apiUrl}/expenses`, { params });
      setExpenseBreakdown(
        res.data.map((item: any) => ({
          ...item,
          key: item.expenses_id.toString(),
        }))
      );
    } catch (err) {
      console.error("Error fetching expenses:", err);
      message.error("Failed to fetch expenses.");
    }
  };

  // Initial fetch
  useEffect(() => {
    if (dates[0] && dates[1]) {
      fetchExpenses(
        dates[0].format("YYYY-MM-DD"),
        dates[1].format("YYYY-MM-DD")
      );
    }
  }, []);

  // Handle date range change from filter modal
  const handleApplyDates = (start: Dayjs | null, end: Dayjs | null) => {
    if (start && end) {
      setDates([start, end]);
      fetchExpenses(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    }
  };

  const handleResetDates = () => {
    const start = dayjs().startOf("month");
    const end = dayjs();

    setDates([start, end]);
    fetchExpenses(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  };

  // ====== ACTION HANDLERS ======
  const handleView = (record: ExpenseItem) => {
    setSelectedExpense(record);
    setViewModalVisible(true);
  };
  const handleEdit = (record: ExpenseItem) => {
    setSelectedExpense(record);
    setEditModalVisible(true);
  };
  const handleDelete = async (record: ExpenseItem) => {
    if (
      window.confirm(`Are you sure you want to delete "${record.description}"?`)
    ) {
      try {
        await axios.delete(`${apiUrl}/expenses/${record.expenses_id}`);
        setExpenseBreakdown((prev) =>
          prev.filter((item) => item.expenses_id !== record.expenses_id)
        );
        message.success("Deleted successfully");
      } catch (err) {
        console.error("Error deleting expense:", err);
        message.error("Failed to delete expense.");
      }
    }
  };

  const columns: any = [
    {
      title: "Date",
      dataIndex: "expense_date",
      render: (d: string) => dayjs(d).format("MMM DD, YYYY"),
    },
    { title: "Category", dataIndex: "category" },
    { title: "Subcategory", dataIndex: "subcategory" },
    {
      title: "Description",
      dataIndex: "description",
      render: (text: string) => (
        <div className="description-column">{text}</div>
      ),
    },
    {
      title: "Amount (₱)",
      dataIndex: "amount",
      render: (val: number) => <span className="font-semibold">₱{val}</span>,
    },
    { title: "Method", dataIndex: "method" },
    { title: "Receipt No.", dataIndex: "receipt_no" },
    { title: "Remarks", dataIndex: "remarks" },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ExpenseItem) => (
        <div className="flex gap-2">
          <Tooltip title="View Expense Details">
            <ActionButton
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>

          {record.created_by === currentUserId && (
            <>
              <Tooltip title="Edit Expense">
                <ActionButton
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>

              <Tooltip title="Delete Expense">
                <ActionButton
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                />
              </Tooltip>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <StyledContainer>
      {/* HEADER */}
      <div className="mb-6">
        {/* ===== ROW 1: Title + Filter + Reset ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          {/* Left: Title */}
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-wide">
            Expenses Management
          </h1>

          {/* Right: Filter + Reset */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <ExpensesFilterModal dates={dates} setDates={handleApplyDates} />
            </div>

            <Button className="w-full sm:w-auto" onClick={handleResetDates}>
              Reset
            </Button>
          </div>
        </div>

        {/* ===== ROW 2: Subtitle + Add + Export PDF ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
          <p className="text-gray-500 dark:text-gray-300 text-sm">
            Overview of your expense performance
          </p>

          <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
            <Button
              icon={<PlusOutlined />}
              className="!bg-orange-500 !text-white px-6 !h-11 hover:!bg-orange-600 rounded-xl shadow-md w-full sm:w-auto"
              onClick={() => setModalVisible(true)}
            >
              Add Expense
            </Button>

            <Button
              icon={<FilePdfOutlined />}
              className="!bg-red-500 !text-white px-6 !h-11 hover:!bg-red-600 rounded-xl shadow-md w-full sm:w-auto"
            >
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* EXPENSE BREAKDOWN TABLE */}
      <div className="border-l-4 border-blue-500 pl-4 mb-4 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Expense Breakdown (Detailed)
        </h2>
      </div>

      <StyledTable
        columns={columns}
        dataSource={expenseBreakdown}
        pagination={{ pageSize: 5 }}
        scroll={{ x: true }}
      />

      {/* MODALS */}
      <AddExpensesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onFinish={(newExpense) => {
          setExpenseBreakdown((prev) => [
            { ...newExpense, key: newExpense.expenses_id.toString() },
            ...prev,
          ]);
        }}
      />

      <ViewExpensesModal
        isVisible={viewModalVisible}
        selectedExpense={selectedExpense}
        onClose={() => setViewModalVisible(false)}
      />

      <EditExpensesModal
        visible={editModalVisible}
        selectedExpense={selectedExpense}
        onClose={() => setEditModalVisible(false)}
        onUpdate={(updatedExpense) => {
          setExpenseBreakdown((prev) =>
            prev.map((item) =>
              item.expenses_id === updatedExpense.expenses_id
                ? { ...item, ...updatedExpense }
                : item
            )
          );
        }}
      />
    </StyledContainer>
  );
};

export default WorkerManageExpenses;
