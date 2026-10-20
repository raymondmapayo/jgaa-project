/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  FolderOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, message, Switch, Table, Tooltip } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import WorkerReservationModal from "../WorkerModals/WorkerViewReservationModal";
import ReservationCanceledModal from "../WorkerModals/ReservationCanceledModal";
import ArchiveReservationModal from "./Archive/ArchiveReservationModal";

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

// ====================== Type Definitions ======================
interface Reservation {
  reservation_id: number;
  user_id: number;

  full_name: string;
  email: string;
  pnum: string;

  reservation_date: string;
  reservation_time: string;
  num_of_people: number;
  status: string;
  payment_status: string;
  table_status: string;
  special_request: string;
  reservation_type: string;
  reservation_status: string;
}

type SortKey =
  | "default"
  | "newest"
  | "oldest"
  | "reserved"
  | "completed"
  | "canceled";

const SORT_LABELS: Record<SortKey, string> = {
  default: "Default order",
  newest: "Date: Newest first",
  oldest: "Date: Oldest first",
  reserved: "Status: Reserved first",
  completed: "Status: Completed first",
  canceled: "Status: Canceled first",
};

const STATUS_FOR_SORT: Partial<Record<SortKey, string>> = {
  reserved: "Reserved",
  completed: "Completed",
  canceled: "Canceled",
};

// ====================== Component ======================
const WorkerReservation = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchivedModalVisible, setIsArchivedModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null);

  const [reservationEnabled, setReservationEnabled] = useState<boolean>(false);

  const [canceledModalVisible, setCanceledModalVisible] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Stats for the summary cards (always based on all reservations)
  const totalReservations = reservations.length;
  const reservedCount = reservations.filter(
    (r) => r.table_status === "Reserved",
  ).length;
  const completedCount = reservations.filter(
    (r) => r.table_status === "Completed",
  ).length;
  const canceledCount = reservations.filter(
    (r) => r.table_status === "Canceled",
  ).length;

  // Search + sort
  const visibleReservations = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    const filtered = term
      ? reservations.filter((r: any) =>
          [
            `R${String(r.reservation_id).padStart(3, "0")}`,
            r.full_name,
            r.email,
            r.pnum,
            r.table_ids,
            r.table_status,
          ]
            .filter((v) => v !== undefined && v !== null)
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : reservations;

    if (sortKey === "default") return filtered;

    const toTime = (r: Reservation) =>
      dayjs(
        `${dayjs(r.reservation_date).format("YYYY-MM-DD")} ${r.reservation_time}`,
      ).valueOf();

    return [...filtered].sort((a, b) => {
      const wanted = STATUS_FOR_SORT[sortKey];
      if (wanted) {
        const rank = (s: string) => (s === wanted ? 0 : 1);
        return rank(a.table_status) - rank(b.table_status);
      }
      const diff = toTime(b) - toTime(a);
      return sortKey === "newest" ? diff : -diff;
    });
  }, [reservations, searchText, sortKey]);

  const handleEditReservation = (record: Reservation) => {
    setCurrentReservation(record);
    setCanceledModalVisible(true);
  };

  useEffect(() => {
    const fetchReservationStatus = async () => {
      try {
        const res = await axios.get(`${apiUrl}/get_reservation_status`);
        const status = res.data?.reservation_enabled === 1;

        setReservationEnabled(status);

        console.log("🔁 Current reservation status:", status);
      } catch (error) {
        console.error("❌ Failed to fetch reservation status:", error);
      }
    };

    fetchReservationStatus();
  }, [apiUrl]);

  const fetchReservations = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);

      const response = await axios.get(`${apiUrl}/get_reservation`);
      setReservations(response.data);
    } catch (error) {
      console.error("❌ Failed to fetch reservations:", error);
      message.error("Failed to load reservations.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    // fetch balik inig balik sa tab (walay interval)
    const onFocus = () => fetchReservations(false);
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [apiUrl]);

  // ✅ Toggle reservation status
  const handleToggleReservation = async (checked: boolean) => {
    try {
      await axios.put(`${apiUrl}/update_reservation_status`, {
        reservation_enabled: checked ? 1 : 0,
      });

      setReservationEnabled(checked);

      message.success(
        checked
          ? "✅ Online reservations have been enabled."
          : "🚫 Online reservations have been disabled.",
      );
    } catch (error) {
      console.error("Error updating reservation status:", error);

      message.error("Failed to update reservation status.");
    }
  };

  const handleDeleteReservation = async (reservation_id: number) => {
    const reservation = reservations.find(
      (r) => r.reservation_id === reservation_id,
    );

    if (!reservation) return;

    try {
      await axios.delete(
        `${apiUrl}/delete_reservation/${reservation.user_id}/${reservation_id}`,
      );

      setReservations((prev) =>
        prev.filter((r) => r.reservation_id !== reservation_id),
      );

      Swal.fire("Deleted!", "The reservation has been deleted.", "success");
    } catch (error) {
      console.error("Error deleting reservation:", error);

      Swal.fire("Error", "Failed to delete reservation.", "error");
    }
  };

  const confirmDelete = async (reservation_id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action is permanent and cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      await handleDeleteReservation(reservation_id);
    }
  };

  const handleRowClick = (record: Reservation) => {
    setCurrentReservation(record);
    setModalVisible(true);
  };

  const getInitials = (name?: string) =>
    (name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  const columns = [
    {
      title: "ID",
      dataIndex: "reservation_id",
      key: "reservation_id",
      render: (_: any, record: any) => (
        <span className="inline-block rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">
          R{record.reservation_id.toString().padStart(3, "0")}
        </span>
      ),
    },

    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
      render: (name: string) => (
        <div className="flex items-center gap-3 min-w-[170px]">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 shadow-sm ring-2 ring-white">
            {getInitials(name)}
          </span>
          <span className="font-semibold text-sm sm:text-base">{name}</span>
        </div>
      ),
    },

    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },

    {
      title: "Phone",
      dataIndex: "pnum",
      key: "pnum",
    },

    {
      title: "Table",
      dataIndex: "table_ids",
      key: "table_ids",
      render: (tables: any) =>
        tables ? (
          <span className="inline-block whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {tables}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },

    {
      title: "Date",
      dataIndex: "reservation_date",
      key: "reservation_date",
      render: (_: any, record: any) => (
        <span className="whitespace-nowrap font-medium">
          {dayjs(record.reservation_date).format("YYYY-MM-DD")}
        </span>
      ),
    },

    {
      title: "Time",
      dataIndex: "reservation_time",
      key: "reservation_time",
      render: (_: any, record: any) => (
        <span className="whitespace-nowrap">
          {dayjs(record.reservation_time, "HH:mm:ss").format("h:mm A")}
        </span>
      ),
    },

    {
      title: "Status",
      dataIndex: "table_status",
      key: "table_status",
      render: (status: string) => {
        const styles: Record<string, { dot: string; text: string }> = {
          Reserved: { dot: "bg-orange-400", text: "text-orange-500" },
          Canceled: { dot: "bg-red-500", text: "text-red-500" },
          Completed: { dot: "bg-green-500", text: "text-green-600" },
        };
        const s = styles[status] ?? {
          dot: "bg-gray-400",
          text: "text-gray-500",
        };
        const isActive = status === "Reserved";

        return (
          <span
            className={`inline-flex items-center gap-2 whitespace-nowrap font-semibold ${s.text}`}
          >
            {/* status dot, like an "online" indicator */}
            <span className="relative flex h-2.5 w-2.5">
              {isActive && (
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${s.dot}`}
                />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`}
              />
            </span>
            {status}
          </span>
        );
      },
    },

    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="View Reservation Details">
            <ActionButton
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleRowClick(record)}
            />
          </Tooltip>

          <Tooltip title="Edit Reservation">
            <ActionButton
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditReservation(record)}
            />
          </Tooltip>

          <Tooltip title="Delete Reservation">
            <ActionButton
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDelete(record.reservation_id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <StyledContainer>
      {/* Title (left) + Summary cards (right) */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Reservations</h2>
          <p className="text-gray-500 text-sm">Manage and track reservations</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:grid-cols-4 lg:w-auto lg:min-w-[560px]">
          {/* Total */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="m-0 text-2xl font-bold text-blue-600">
              {totalReservations}
            </p>
            <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Total
            </p>
          </div>

          {/* Reserved */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="m-0 text-2xl font-bold text-orange-500">
              {reservedCount}
            </p>
            <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              Reserved
            </p>
          </div>

          {/* Completed */}
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="m-0 text-2xl font-bold text-green-600">
              {completedCount}
            </p>
            <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Completed
            </p>
          </div>

          {/* Canceled */}
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="m-0 text-2xl font-bold text-red-500">
              {canceledCount}
            </p>
            <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Canceled
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        {/* 🔍 Search Input */}
        <div className="w-full lg:w-1/3">
          <Input
            allowClear
            size="large"
            placeholder="Search by ID, name, email, phone or status"
            prefix={<SearchOutlined className="text-gray-400" />}
            className="w-full rounded-xl bg-gray-100"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchText.trim() && (
            <p className="m-0 mt-2 text-xs text-gray-500">
              {visibleReservations.length}{" "}
              {visibleReservations.length === 1 ? "result" : "results"} for "
              {searchText.trim()}"
            </p>
          )}
        </div>

        {/* ✅ Right Controls */}
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2">
            <span className="font-semibold text-gray-700 whitespace-nowrap">
              Online Reservation:
            </span>

            <Switch
              checkedChildren="Enabled"
              unCheckedChildren="Disabled"
              checked={reservationEnabled}
              onChange={handleToggleReservation}
            />
          </div>

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
              className={
                sortKey !== "default"
                  ? "!border-blue-500 !bg-blue-50 !text-blue-600"
                  : ""
              }
            >
              {sortKey === "default" ? "Sort" : "Sorted"}
            </Button>
          </Dropdown>

          {/* 🗂️ Archive Button */}
          <Button
            className="bg-red-500 text-[#fafafa] hover:bg-red-600 focus:ring-4 focus:ring-red-300 rounded-md w-full sm:w-[170px]"
            icon={<FolderOutlined />}
            onClick={() => setIsArchivedModalVisible(true)}
            size="middle"
          >
            Archived
          </Button>
        </div>
      </div>

      <StyledTable
        dataSource={visibleReservations}
        columns={columns}
        rowKey="reservation_id"
        pagination={{
          current: currentPage,
          pageSize: 5,
          showSizeChanger: false,
          onChange: (page) => setCurrentPage(page),
        }}
        loading={isLoading}
        scroll={{ x: true }}
        locale={{
          emptyText: searchText.trim()
            ? "No reservations match your search."
            : "No reservations yet.",
        }}
      />

      <WorkerReservationModal
        visible={modalVisible}
        reservation={currentReservation}
        apiUrl={apiUrl}
        onClose={() => setModalVisible(false)}
      />

      {/* Archived Modal */}
      <ArchiveReservationModal
        isArchivedModalVisible={isArchivedModalVisible}
        onClose={() => setIsArchivedModalVisible(false)}
      />

      <ReservationCanceledModal
        visible={canceledModalVisible}
        onClose={() => setCanceledModalVisible(false)}
        reservation={currentReservation}
        onUpdateReservation={(updated) => {
          setReservations((prev) =>
            prev.map((r) =>
              r.reservation_id === updated.reservation_id
                ? { ...r, ...updated }
                : r,
            ),
          );
        }}
      />
    </StyledContainer>
  );
};

export default WorkerReservation;
