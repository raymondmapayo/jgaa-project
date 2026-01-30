import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  FolderOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, Modal, Table, Tag, Tooltip } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import styled from "styled-components";
import dayjs from "dayjs";

import AddExpensesSubCategoryModal from "../WorkerModals/AddExpensesSubCategoryModal";
import ArchiveExpensesSubCategoryModal from "./Archive/ArchiveExpensesSubCategoryModal";

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
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 16px;
    padding-bottom: 16px;
    box-shadow: none;
    overflow-x: hidden;
  }

  @media (max-width: 768px) {
    padding-left: 12px;
    padding-right: 12px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  @media (max-width: 480px) {
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
`;

const StyledTable = styled(Table)`
  width: 100%;

  .ant-table {
    width: 100%;
  }

  .ant-table-content {
    width: 100%;
    min-width: 0 !important; /* allow table to shrink */
    overflow-x: auto; /* horizontal scroll only if needed */
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

interface ExpensesSubCategoryItem {
  key: string;
  subcategory: string;
  created_at: string;
  status: string;
  expenses_subcategory_id: number;
}

const WorkerManageExpensesSubCategory = () => {
  const [dataSource, setDataSource] = useState<ExpensesSubCategoryItem[]>([]);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = dataSource.slice(indexOfFirstItem, indexOfLastItem);
  const [isArchivedModalVisible, setIsArchivedModalVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const sortMenuItems = [
    { key: "1", label: "Sort by Date" },
    { key: "2", label: "Sort by Name" },
  ];

  // Polling function to fetch updated expense categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_expenses_subcategories`, {
        headers: { "Cache-Control": "no-cache" },
      });
      setDataSource(response.data);
    } catch (error) {
      console.error("Error fetching expense subcategories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const wrappedFetchCategories = async () => {
      if (isMounted) {
        await fetchCategories();
      }
    };

    wrappedFetchCategories();
    const interval = setInterval(wrappedFetchCategories, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl]);

  const handleAddSubCategory = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_expenses_subcategories`);
      setDataSource(response.data);
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("Error fetching updated expense categories:", error);
    }
  };

  const handleEdit = (record: ExpensesSubCategoryItem) => {
    setSelectedItem(record);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = (updatedSubCategory: ExpensesSubCategoryItem) => {
    setDataSource((prevData) =>
      prevData.map((cat) =>
        cat.expenses_subcategory_id ===
        updatedSubCategory.expenses_subcategory_id
          ? updatedSubCategory
          : cat
      )
    );
    setCurrentPage(1);
  };

  const handleViewDetails = (record: any) => {
    setSelectedItem(record);
    setIsDetailModalVisible(true);
  };

  const handleDelete = async (expenses_subcategory_id: number) => {
    Modal.confirm({
      title: "Are you sure you want to archive this subcategory?",
      content:
        "This action will mark the subcategory as deleted, but will not remove it permanently.",
      okText: "Yes, Archive",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setDataSource((prevData) =>
            prevData.filter(
              (item) => item.expenses_subcategory_id !== expenses_subcategory_id
            )
          );
          await axios.delete(
            `${apiUrl}/subcategories_expenses_delete/${expenses_subcategory_id}`
          );
        } catch (error) {
          console.error("Error archiving subcategory:", error);
          const response = await axios.get(
            `${apiUrl}/get_expenses_subcategories`
          );
          setDataSource(response.data);
        }
      },
    });
  };

  const columns = [
    {
      title: "SubCategory ID",
      dataIndex: "expenses_subcategory_id",
      key: "expenses_subcategory_id",
    },
    {
      title: "SubCategory Name",
      dataIndex: "subcategory",
      key: "subcategory",
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (createdAt: string) =>
        dayjs(createdAt).format("MM-DD-YYYY h:mm A"), // ✅ format like 2025-09-03 8:10 PM
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const formattedStatus =
          status.charAt(0).toUpperCase() + status.slice(1);

        const colors: Record<string, string> = {
          Active: "green",
          Inactive: "red",
        };

        return (
          <Tag color={colors[formattedStatus] || "default"}>
            {formattedStatus}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="View Sub Category Details">
            <ActionButton
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit SubCategory">
            <ActionButton
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete SubCategory">
            <ActionButton
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.expenses_subcategory_id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const handleShowArchived = () => {
    setIsArchivedModalVisible(true);
  };

  return (
    <StyledContainer>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Expense Categories List</h2>
          <p className="text-gray-500 text-sm">
            Manage your Expense Categories
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Input
            placeholder="Search categories"
            prefix={<SearchOutlined />}
            className="w-full sm:w-1/4 bg-gray-100 dark:bg-[#1f2937] dark:text-white custom-placeholder"
          />

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              className="bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300 rounded-md w-full sm:w-[170px]"
              icon={<FolderOutlined />}
              onClick={handleShowArchived}
              size="middle"
            >
              Archived
            </Button>

            <Button
              type="primary"
              size="middle"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              className="px-3 sm:px-4 py-1.5 shadow-md w-full sm:w-[170px]"
            >
              Add New Category
            </Button>

            <Dropdown menu={{ items: sortMenuItems }} placement="bottomLeft">
              <Button
                icon={<FilterOutlined />}
                className="w-full sm:w-[170px] px-3 py-1.5 text-center"
              >
                Sort by
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto lg:overflow-x-hidden">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <StyledTable
            dataSource={currentCategories}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: itemsPerPage,
              total: dataSource.length,
              onChange: (page) => setCurrentPage(page),
            }}
            scroll={{ x: true }}
          />
        )}
      </div>

      {/* Category Detail Modal */}
      <Modal
        title="Category Details"
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedItem && (
          <div>
            <p>
              <strong>Category Name:</strong> {selectedItem.category}
            </p>
            <p>
              <strong>Created At:</strong> {selectedItem.created_at}
            </p>
            <p>
              <strong>Status:</strong> {selectedItem.status}
            </p>
          </div>
        )}
      </Modal>

      <ArchiveExpensesSubCategoryModal
        isArchivedModalVisible={isArchivedModalVisible}
        onClose={() => setIsArchivedModalVisible(false)}
        onRestore={() => fetchCategories()} // Add this callback
      />

      <AddExpensesSubCategoryModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onFinish={handleAddSubCategory}
      />
    </StyledContainer>
  );
};

export default WorkerManageExpensesSubCategory;
