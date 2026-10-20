/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, Table, Tag, Tooltip } from "antd";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import AddMenuForm from "../../components/form/AddMenu";
import MenuEditModal from "../WorkerModals/MenuEditModal";
import ViewDetailsModal from "../WorkerModals/ViewDetailsModal";
import dayjs from "dayjs";
const StyledContainer = styled.div`
  width: 100%;
  background-color: #fafafa;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease;
  margin: 0 auto;
  box-sizing: border-box;

  .dark & {
    background-color: #001f3f;
    color: #fafafa !important;
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

type SortKey = "default" | "newest" | "oldest" | "availability";

const SORT_LABELS: Record<SortKey, string> = {
  default: "Default order",
  newest: "Date: Newest first",
  oldest: "Date: Oldest first",
  availability: "Availability: Available first",
};

interface MenuItem {
  key: string;
  item_name: string;
  category: string;
  price: string;
  description: string;

  menu_img: string;
  menu_id: number; // Add the menu_id property
  availability: string; // Add availability property
}

const WorkerManageMenu = () => {
  const [dataSource, setDataSource] = useState<MenuItem[]>([]);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Stats for the summary cards (always based on all items)
  const totalItems = dataSource.length;
  const availableItems = dataSource.filter(
    (item) => item.availability === "Available",
  ).length;
  const unavailableItems = totalItems - availableItems;

  // Search + sort
  const visibleItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = term
      ? dataSource.filter((item: any) =>
          [item.item_name, item.categories_name, item.description]
            .filter(Boolean)
            .some((field: string) => field.toLowerCase().includes(term)),
        )
      : dataSource;

    if (sortKey === "default") return filtered;

    return [...filtered].sort((a: any, b: any) => {
      if (sortKey === "availability") {
        const rank = (v: string) => (v === "Available" ? 0 : 1);
        return rank(a.availability) - rank(b.availability);
      }
      const diff =
        dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf();
      return sortKey === "newest" ? diff : -diff;
    });
  }, [dataSource, searchTerm, sortKey]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMenus = visibleItems.slice(indexOfFirstItem, indexOfLastItem);

  // Fetch menu items from the database
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get(`${apiUrl}/menu_items`);
        console.log("Fetched Data:", response.data);
        setDataSource(response.data);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch on mount
    fetchMenuItems();
  }, [apiUrl]);

  // Handlers
  const handleViewDetails = (record: any) => {
    setSelectedItem(record);
    setIsDetailModalVisible(true);
  };

  const handleEdit = (record: MenuItem) => {
    setSelectedItem(record);
    setIsEditModalVisible(true);
  };

  // Updated Save Edit handler
  const handleSaveEdit = async (values: MenuItem) => {
    const updatedData = dataSource.map((item) =>
      item.menu_id === selectedItem?.menu_id ? { ...item, ...values } : item,
    );

    setDataSource(updatedData); // update table
    setIsEditModalVisible(false);
    setSelectedItem(null);
  };

  // Table Columns
  const columns = [
    {
      title: "Food Name",
      dataIndex: "item_name",
      key: "item_name",
      render: (text: any, record: any) => (
        <div className="flex items-center gap-3 min-w-[160px]">
          <img
            src={
              record.menu_img?.startsWith("http")
                ? record.menu_img
                : `${apiUrl}/uploads/images/${record.menu_img}`
            }
            alt={record.item_name}
            className="h-10 w-10 flex-shrink-0 rounded-2xl object-cover ring-2 ring-orange-400 ring-offset-2"
          />
          <span className="text-sm sm:text-base">{text}</span>
        </div>
      ),
    },
    { title: "Category", dataIndex: "categories_name", key: "categories_name" },
    { title: "Price", dataIndex: "price", key: "price" },
    { title: "Description", dataIndex: "description", key: "description" },

    {
      title: "Availability",
      dataIndex: "availability",
      key: "availability",
      render: (text: string) => {
        const styles: Record<string, { dot: string; text: string }> = {
          Available: { dot: "bg-green-500", text: "text-green-600" },
          "Not Available": { dot: "bg-red-500", text: "text-red-500" },
          Pending: { dot: "bg-orange-400", text: "text-orange-500" },
        };
        const s = styles[text] ?? { dot: "bg-gray-400", text: "text-gray-500" };
        const isOnline = text === "Available";

        return (
          <span
            className={`inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ${s.text}`}
          >
            {/* status dot, like an "online" indicator */}
            <span className="relative flex h-1.5 w-1.5">
              {isOnline && (
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${s.dot}`}
                />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`}
              />
            </span>
            {text}
          </span>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (createdAt: string) =>
        dayjs(createdAt).format("MM-DD-YYYY h:mm A"),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="View Details">
            <ActionButton
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Menu">
            <ActionButton
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // Updated Add Menu handler
  const handleAddMenu = async () => {
    try {
      const response = await axios.get(`${apiUrl}/menu_items`);
      setDataSource(response.data); // refresh table after adding
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("Error fetching updated menu items:", error);
    }
  };
  return (
    <StyledContainer>
      {/* Header Section */}
      <div className="w-full mb-6">
        <div className="flex flex-col gap-6 w-full">
          {/* Title (left) + Summary cards (right) */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Menu List</h2>
              <p className="text-gray-500 text-sm">Manage your food menu</p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[440px]">
              {/* Total */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="m-0 text-2xl font-bold text-blue-600">
                  {totalItems}
                </p>
                <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Total items
                </p>
              </div>

              {/* Available */}
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="m-0 text-2xl font-bold text-green-600">
                  {availableItems}
                </p>
                <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Available
                </p>
              </div>

              {/* Unavailable */}
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="m-0 text-2xl font-bold text-red-500">
                  {unavailableItems}
                </p>
                <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Unavailable
                </p>
              </div>
            </div>
          </div>

          {/* Search + Actions Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
            {/* Search */}
            <div className="w-full md:w-1/3">
              <Input
                allowClear
                size="large"
                placeholder="Search by name or category"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl bg-gray-100 dark:bg-[#1f2937] dark:text-[#fafafa] custom-placeholder"
              />
              {searchTerm.trim() && (
                <p className="m-0 mt-2 text-xs text-gray-500">
                  {visibleItems.length}{" "}
                  {visibleItems.length === 1 ? "result" : "results"} for "
                  {searchTerm.trim()}"
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="w-full sm:w-[140px]"
                onClick={() => setIsAddModalVisible(true)}
              >
                Add Menu
              </Button>

              <Button
                type="default"
                icon={<UploadOutlined />}
                className="w-full sm:w-[140px]"
              >
                Import Menu
              </Button>
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
                  className={`w-full sm:w-[140px] ${
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
      </div>
      {/* Menu Table - scrolls on small screens */}
      <div className="overflow-x-auto lg:overflow-x-hidden">
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <StyledTable
            dataSource={currentMenus}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: itemsPerPage,
              total: visibleItems.length,
              onChange: (page) => setCurrentPage(page),
            }}
            scroll={{ x: true }}
            locale={{
              emptyText: searchTerm.trim()
                ? "No menu items match your search."
                : "No menu items yet.",
            }}
          />
        )}
      </div>

      {/* Modals */}
      <ViewDetailsModal
        isVisible={isDetailModalVisible}
        selectedItem={selectedItem}
        onClose={() => setIsDetailModalVisible(false)}
      />
      <MenuEditModal
        isVisible={isEditModalVisible}
        selectedItem={selectedItem}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveEdit}
      />
      <AddMenuForm
        isAddModalVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddMenu={handleAddMenu}
      />
    </StyledContainer>
  );
};

export default WorkerManageMenu;
