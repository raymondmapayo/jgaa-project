import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  FolderOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Dropdown,
  Input,
  Menu,
  message,
  Switch,
  Table,
  Tooltip,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import ReservationModal from "../AdminModals/ReservationModal";
import ReservationDissolveModal from "../AdminModals/ReservationDissolveModal";
// ====================== Styled Components ======================
const StyledContainer = styled.div`
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
  margin: 0 auto;

  .dark & {
    background-color: #001f3f;
    color: white;
  }

  @media (max-width: 1024px) {
    border-radius: 0;
    box-shadow: none;
    width: 100vw;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    padding: 16px;
  }
`;

const StyledTable = styled(Table)`
  width: 100%;
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
    .ant-table-content {
      overflow-x: auto;
    }
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
  table_ids: string;
  reservation_date: string;
  reservation_time: string;
  table_status: string;
}

interface Client {
  user_id: number;
  full_name: string;
  email: string;
  pnum: string;
}

// ====================== Component ======================
const Reservation = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  // In Reservation component
  const [reservationEnabled, setReservationEnabled] = useState<boolean>(false);
  const [dissolveModalVisible, setDissolveModalVisible] = useState(false); // ✅ added
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleEditReservation = (record: Reservation) => {
    setCurrentReservation(record);
    setDissolveModalVisible(true); // ✅ open dissolve modal
  };

  const handleArchive = () => {
    // Example: Open a modal or archive selected reservations
    console.log("Archive button clicked");
  };

  useEffect(() => {
    const completePastReservations = async () => {
      try {
        // Trigger backend to mark past Reserved tables as Completed
        await axios.post(`${apiUrl}/update_completed_tables`);
        console.log("✅ Reserved tables updated to Completed if past due");

        // Refresh reservations after update
        const resReservations = await axios.get(`${apiUrl}/get_reservation`);
        setReservations(resReservations.data);
      } catch (err) {
        console.error("❌ Failed to update completed tables:", err);
      }
    };

    // Run immediately on load
    completePastReservations();

    // Re-run every 5 minutes if page is left open
    const interval = setInterval(completePastReservations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resReservations, resClients] = await Promise.all([
          axios.get(`${apiUrl}/get_reservation`),
          axios.get(`${apiUrl}/get_clients`),
        ]);
        setReservations(resReservations.data);
        setClients(resClients.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Toggle reservation status
  const handleToggleReservation = async (checked: boolean) => {
    try {
      setReservationEnabled(checked);
      await axios.put(`${apiUrl}/update_reservation_status`, {
        reservation_enabled: checked ? 1 : 0,
      });

      message.success(
        checked
          ? "✅ Online reservations have been enabled."
          : "🚫 Online reservations have been disabled. Customers will see a message instead."
      );
    } catch (error) {
      console.error(error);
      message.error("Failed to update reservation status.");
    }
  };

  const handleDeleteReservation = (reservation_id: number) => {
    const reservation = reservations.find(
      (r) => r.reservation_id === reservation_id
    );
    if (!reservation) return;
    axios
      .delete(
        `${apiUrl}/delete_reservation/${reservation.user_id}/${reservation_id}`
      )
      .then(() => {
        setReservations((prev) =>
          prev.filter((r) => r.reservation_id !== reservation_id)
        );
        Swal.fire("Deleted!", "The reservation has been deleted.", "success");
      })
      .catch(() =>
        Swal.fire("Error", "Failed to delete reservation.", "error")
      );
  };

  const confirmDelete = (reservation_id: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action is permanent and cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) handleDeleteReservation(reservation_id);
    });
  };

  const handleRowClick = (record: Reservation) => {
    setCurrentReservation(record);
    const client = clients.find((c) => c.user_id === record.user_id) || null;
    setCurrentClient(client);
    setModalVisible(true);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "reservation_id",
      key: "reservation_id",
      render: (_: any, record: any) =>
        `R${record.reservation_id.toString().padStart(3, "0")}`,
    },
    { title: "Name", dataIndex: "full_name", key: "full_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "pnum", key: "pnum" },
    { title: "Table", dataIndex: "table_ids", key: "table_ids" },
    {
      title: "Date",
      dataIndex: "reservation_date",
      key: "reservation_date",
      render: (_: any, record: any) =>
        dayjs(record.reservation_date).format("YYYY-MM-DD"),
    },
    {
      title: "Time",
      dataIndex: "reservation_time",
      key: "reservation_time",
      render: (_: any, record: any) =>
        dayjs(record.reservation_time, "HH:mm:ss").format("h:mm A"),
    },
    {
      title: "Status",
      dataIndex: "table_status",
      key: "table_status",
      render: (status: string) => {
        let color = "";
        switch (status) {
          case "Reserved":
            color = "orange"; // Reserved → Orange
            break;
          case "Dissolve":
            color = "red"; // Dissolve → Red
            break;
          case "Completed":
            color = "green"; // Completed → Green
            break;
          default:
            color = "default"; // fallback color
        }

        return <Badge color={color} text={status} />;
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
              onClick={() => handleEditReservation(record)} // ✅ opens dissolve modal
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
      <div className="mb-6">
        <h2 className="text-xl font-bold">Reservations</h2>
        <p className="text-gray-500 text-sm">Manage and track reservations</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        {/* 🔍 Search Input */}
        <Input
          placeholder="Search reservation"
          prefix={<SearchOutlined />}
          className="w-full sm:w-1/4"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {/* ✅ Right Controls */}
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
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
            overlay={
              <Menu>
                <Menu.Item key="1">Sort by Date</Menu.Item>
                <Menu.Item key="2">Sort by Status</Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <Button icon={<FilterOutlined />}>Sort</Button>
          </Dropdown>

          {/* 🗂️ Archive Button */}
          <Button
            className="bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300 rounded-md w-full sm:w-[170px]"
            icon={<FolderOutlined />}
            onClick={handleArchive}
          >
            Archive
          </Button>
        </div>
      </div>

      <StyledTable
        dataSource={reservations.filter(
          (r) =>
            r.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
            r.email.toLowerCase().includes(searchText.toLowerCase()) ||
            r.pnum.toLowerCase().includes(searchText.toLowerCase())
        )}
        columns={columns}
        rowKey="reservation_id"
        pagination={{ pageSize: 5, showSizeChanger: false }}
        loading={isLoading}
        scroll={{ x: true }}
      />

      <ReservationModal
        visible={modalVisible}
        reservation={currentReservation}
        client={currentClient}
        apiUrl={apiUrl}
        onClose={() => setModalVisible(false)}
      />

      <ReservationDissolveModal
        visible={dissolveModalVisible}
        onClose={() => setDissolveModalVisible(false)}
        reservation={currentReservation}
        onUpdateReservation={(updated) => {
          setReservations((prev) =>
            prev.map((r) =>
              r.reservation_id === updated.reservation_id
                ? { ...r, ...updated } // ✅ merge with existing reservation
                : r
            )
          );
        }}
      />
    </StyledContainer>
  );
};

export default Reservation;
