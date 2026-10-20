/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CheckCircleOutlined,
  FilterOutlined,
  FolderOutlined,
  PrinterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, notification, Table, Tooltip } from "antd";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import OrderDetailsModal from "../WorkerModals/ViewOrderDetailsModal";
import ValidationEditTabsModal from "./Tabs/ValidationEditModalTabs";
import OrdersPdfModal from "./Pdf/OrdersPdfModal";

// ====================== Styled Components ======================
const StyledContainer = styled.div`
  width: 100%;
  background-color: #fafafa;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
  margin: 0 auto;
  box-sizing: border-box;

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

// ====================== Types ======================
interface Order {
  order_id: number;
  user_id: number;

  fname: string;
  lname: string;
  profile_pic: string | null;

  order_date: string;
  payment_status: "pending" | "paid";

  created_by: number | null;

  worker_fname?: string | null;
  worker_lname?: string | null;
  worker_profile_pic?: string | null;
}
interface OrderItem {
  order_item_id: number;
  product_name: string;
  quantity: number;
  price: number;
  final_total: number;
}

type SortKey = "default" | "newest" | "oldest" | "pending" | "paid";

const SORT_LABELS: Record<SortKey, string> = {
  default: "Default order",
  newest: "Date: Newest first",
  oldest: "Date: Oldest first",
  pending: "Status: Pending first",
  paid: "Status: Paid first",
};

const WorkerManageOrder = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersPdfVisible, setOrdersPdfVisible] = useState(false);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState<Order | null>(
    null,
  );

  // Search, sort and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ States for combined Validation & Edit tab modal
  const [isValidationEditVisible, setIsValidationEditVisible] = useState(false);
  const [selectedOrderForValidation, setSelectedOrderForValidation] =
    useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Stats for the summary cards (always based on all orders)
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.payment_status === "pending",
  ).length;
  const paidOrders = orders.filter((o) => o.payment_status === "paid").length;

  // Search + sort
  const visibleOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = term
      ? orders.filter((o) =>
          [
            String(o.order_id),
            `${o.fname} ${o.lname}`,
            o.worker_fname ? `${o.worker_fname} ${o.worker_lname ?? ""}` : "",
            o.payment_status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : orders;

    if (sortKey === "default") return filtered;

    return [...filtered].sort((a, b) => {
      if (sortKey === "pending" || sortKey === "paid") {
        const first = sortKey;
        const rank = (s: string) => (s === first ? 0 : 1);
        return rank(a.payment_status) - rank(b.payment_status);
      }
      const diff =
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
      return sortKey === "newest" ? diff : -diff;
    });
  }, [orders, searchTerm, sortKey]);

  // Handler to fetch transaction and open combined Validate & Edit modal
  const handleValidateEdit = (record: Order) => {
    axios
      .get(`${apiUrl}/fetch_transaction/${record.user_id}`)
      .then((res) => {
        const transactions = res.data.transactions;

        if (!transactions || transactions.length === 0) {
          notification.warning({
            message: "Transaction Not Found",
            description: `No transaction found for this order.`,
          });
          setSelectedOrderForValidation(record);
          setSelectedTransaction(null);
          setIsValidationEditVisible(true);
          return;
        }

        // Get most recent transaction
        const transaction = transactions[0];

        setSelectedOrderForValidation(record);
        setSelectedTransaction(transaction);
        setIsValidationEditVisible(true);

        // Optional: double check if status matches
        if (
          transaction.status.toLowerCase() !==
          record.payment_status.toLowerCase()
        ) {
          notification.info({
            message: "Status Mismatch",
            description: `Order payment status (${record.payment_status}) does not exactly match the latest transaction status (${transaction.status}).`,
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching transaction:", err);
        notification.error({
          message: "Error Fetching Transaction",
          description:
            "An error occurred while fetching the transaction. Please try again.",
        });
      });
  };

  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const response = await axios.get(`${apiUrl}/fetch_orders`);
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);

      notification.error({
        message: "Error",
        description: "Failed to fetch orders.",
      });
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();

    const onFocus = () => {
      fetchOrders(false);
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [apiUrl]);

  const handleViewDetails = (record: Order) => {
    setSelectedOrder(record);
    axios
      .get(`${apiUrl}/fetch_order_items/${record.order_id}`)
      .then((response) => {
        setOrderItems(response.data.orderItems);
        setIsModalVisible(true);
      })
      .catch((error) => {
        console.error("Error fetching order items:", error);
      });
  };

  const formatDateWithTime = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toISOString().split("T")[0];
    const timePart = date
      .toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `${datePart} ${timePart}`;
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const calculateTotal = () =>
    orderItems.reduce((total, item) => total + item.final_total, 0);

  const getAvatarSrc = (pic?: string | null) =>
    pic
      ? pic.startsWith("http")
        ? pic // from Cloudinary
        : `${apiUrl}/uploads/images/${pic}` // from local uploads folder
      : "/avatar.jpg"; // default placeholder

  const columns = [
    {
      title: "Order ID",
      dataIndex: "order_id",
      key: "order_id",
      render: (order_id: string) => (
        <span className="inline-block rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">
          #{order_id}
        </span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "fname",
      key: "fname",
      render: (_text: string, record: any) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <img
            src={getAvatarSrc(record.profile_pic)}
            alt={`${record.fname} ${record.lname}`}
            className="h-11 w-11 flex-shrink-0 rounded-full object-cover shadow-md ring-2 ring-white"
          />
          <span className="font-semibold text-sm sm:text-base">{`${record.fname} ${record.lname}`}</span>
        </div>
      ),
    },
    {
      title: "Order Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (order_date: string) => {
        const [datePart, ...timeParts] =
          formatDateWithTime(order_date).split(" ");
        return (
          <div className="whitespace-nowrap">
            <div className="font-medium">{datePart}</div>
            <div className="text-xs text-gray-400">{timeParts.join(" ")}</div>
          </div>
        );
      },
    },
    {
      title: "Payment Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => {
        const formattedStatus =
          status.charAt(0).toUpperCase() + status.slice(1);
        const styles: Record<string, { dot: string; text: string }> = {
          Pending: { dot: "bg-yellow-500", text: "text-yellow-500" },
          Paid: { dot: "bg-green-500", text: "text-green-500" },
        };
        const s = styles[formattedStatus] ?? {
          dot: "bg-gray-400",
          text: "text-gray-500",
        };
        const isPaid = formattedStatus === "Paid";

        return (
          <span
            className={`inline-flex items-center gap-2 whitespace-nowrap font-semibold ${s.text}`}
          >
            {/* status dot, like an "online" indicator */}
            <span className="relative flex h-2.5 w-2.5">
              {isPaid && (
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${s.dot}`}
                />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`}
              />
            </span>
            {formattedStatus}
          </span>
        );
      },
    },
    {
      title: "Updated By",
      dataIndex: "created_by",
      key: "created_by",
      render: (_: any, record: any) => {
        const hasName = record.worker_fname && record.worker_lname;

        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <img
              src={getAvatarSrc(record.worker_profile_pic)}
              alt={
                hasName
                  ? `${record.worker_fname} ${record.worker_lname}`
                  : "No user"
              }
              className={`h-11 w-11 flex-shrink-0 rounded-full object-cover shadow-md ring-2 ring-white ${
                hasName ? "" : "opacity-60"
              }`}
            />

            <span
              className={`text-sm sm:text-base ${
                hasName ? "font-semibold" : "italic text-gray-400"
              }`}
            >
              {hasName
                ? `${record.worker_fname} ${record.worker_lname}`
                : "Not yet updated"}
            </span>
          </div>
        );
      },
    },

    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="View Order Details">
            <ActionButton
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>

          {/* ✅ Single button for Validate & Edit */}
          <Tooltip title="Validate & Edit">
            <ActionButton
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleValidateEdit(record)}
            />
          </Tooltip>
          {/* ✅ NEW — Print Receipt Button */}
          <Tooltip title="Print Receipt">
            <ActionButton
              type="default"
              icon={<PrinterOutlined />}
              onClick={() => {
                setSelectedOrderForPdf(record);
                setOrdersPdfVisible(true);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <StyledContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-6">
        {/* Title (left) + Summary cards (right) */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Order List</h2>
            <p className="text-gray-500 text-sm">
              Manage and track customer orders
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[440px]">
            {/* Total */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="m-0 text-2xl font-bold text-blue-600">
                {totalOrders}
              </p>
              <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Total orders
              </p>
            </div>

            {/* Pending */}
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
              <p className="m-0 text-2xl font-bold text-yellow-600">
                {pendingOrders}
              </p>
              <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-yellow-700">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Pending
              </p>
            </div>

            {/* Paid */}
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="m-0 text-2xl font-bold text-green-600">
                {paidOrders}
              </p>
              <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Paid
              </p>
            </div>
          </div>
        </div>

        {/* Search + Actions row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="w-full sm:w-1/3">
            <Input
              allowClear
              size="large"
              placeholder="Search by order ID, customer or status"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl bg-gray-100 custom-placeholder"
            />
            {searchTerm.trim() && (
              <p className="m-0 mt-2 text-xs text-gray-500">
                {visibleOrders.length}{" "}
                {visibleOrders.length === 1 ? "result" : "results"} for "
                {searchTerm.trim()}"
              </p>
            )}
          </div>

          {/* Right-side buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Archived */}
            <Button
              className="bg-red-500 text-[#fafafa] hover:bg-red-600 focus:ring-4 focus:ring-red-300 rounded-md w-full sm:w-[140px] text-center"
              icon={<FolderOutlined />}
            >
              Archived
            </Button>

            {/* Sort */}
            <Dropdown
              trigger={["click"]}
              menu={{
                selectable: true,
                selectedKeys: [sortKey],
                onClick: ({ key }) => {
                  setSortKey(key as SortKey);
                  setCurrentPage(1);
                },
                items: (Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({
                  key: k,
                  label: SORT_LABELS[k],
                })),
              }}
            >
              <Button
                icon={<FilterOutlined />}
                className={`w-full sm:w-[140px] px-4 py-1.5 text-center ${
                  sortKey !== "default"
                    ? "!border-blue-500 !bg-blue-50 !text-blue-600"
                    : ""
                }`}
              >
                {sortKey === "default" ? "Sort" : "Sorted"}
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto lg:overflow-x-hidden">
        <StyledTable
          rowKey="order_id"
          dataSource={visibleOrders}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: 5,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
          }}
          scroll={{ x: true }}
          locale={{
            emptyText: searchTerm.trim()
              ? "No orders match your search."
              : "No orders yet.",
          }}
        />
      </div>

      {/* ✅ Combined Validation & Edit Modal */}
      <ValidationEditTabsModal
        isVisible={isValidationEditVisible}
        onClose={() => setIsValidationEditVisible(false)}
        order={selectedOrderForValidation}
        transaction={selectedTransaction}
        onSuccess={fetchOrders}
        onUpdateOrder={(updatedOrder) => {
          setOrders((prevOrders) =>
            prevOrders.map((o) =>
              o.order_id === updatedOrder.order_id
                ? { ...o, ...updatedOrder }
                : o,
            ),
          );
        }}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isVisible={isModalVisible}
        order={selectedOrder}
        orderItems={orderItems}
        onClose={handleCloseModal}
        formatDateWithTime={formatDateWithTime}
        calculateTotal={calculateTotal}
      />

      {ordersPdfVisible && (
        <OrdersPdfModal
          isVisible={ordersPdfVisible}
          onClose={() => setOrdersPdfVisible(false)}
          order={selectedOrderForPdf}
        />
      )}
    </StyledContainer>
  );
};

export default WorkerManageOrder;
