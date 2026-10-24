import { UploadOutlined } from "@ant-design/icons";
import { Button, Modal, Table, Tooltip, Tag, message } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface ArchivedReservation {
  reservation_id: number;
  user_id: number;
  full_name: string;
  email: string;
  table_ids: string;
  reservation_date: string;
  reservation_time: string;
  table_status: string;
  reservation_status: string;
}

interface ArchiveReservationModalProps {
  isArchivedModalVisible: boolean;
  onClose: () => void;
  onRestore?: () => void;
}

const ArchiveReservationModal = ({
  isArchivedModalVisible,
  onClose,
  onRestore,
}: ArchiveReservationModalProps) => {
  const [archivedReservations, setArchivedReservations] = useState<
    ArchivedReservation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!isArchivedModalVisible) return;

    let isMounted = true;

    const fetchArchivedReservations = async () => {
      setIsLoading(true);

      try {
        const response = await axios.get(`${apiUrl}/get_archive_reservation`, {
          headers: { "Cache-Control": "no-cache" },
        });

        if (isMounted) {
          setArchivedReservations(response.data);
        }
      } catch (error) {
        console.error("Error fetching archived reservations:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchArchivedReservations();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, isArchivedModalVisible]);

  const handleRestore = async (reservation_id: number) => {
    const result = await Swal.fire({
      title: "Restore Reservation?",
      text: "This reservation will be restored to the active list.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Restore",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Restoring...",
        text: "Please wait.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await axios.put(`${apiUrl}/restore_reservation/${reservation_id}`);

      // Kuhaa dayon sa archived list
      setArchivedReservations((prev) =>
        prev.filter((item) => item.reservation_id !== reservation_id),
      );

      // I-refresh ang main reservations table
      if (onRestore) {
        onRestore();
      }

      // Automatic close sa Archived modal
      onClose();

      // Success notification
      await Swal.fire({
        title: "Restored!",
        text: "The reservation has been restored successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error restoring reservation:", error);

      Swal.fire({
        title: "Error!",
        text: "Failed to restore reservation. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "reservation_id",
      key: "reservation_id",
      render: (id: number) => `R${id.toString().padStart(3, "0")}`,
    },
    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Table",
      dataIndex: "table_ids",
      key: "table_ids",
    },
    {
      title: "Date",
      dataIndex: "reservation_date",
      key: "reservation_date",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Time",
      dataIndex: "reservation_time",
      key: "reservation_time",
      render: (time: string) => dayjs(time, "HH:mm:ss").format("h:mm A"),
    },
    {
      title: "Status",
      dataIndex: "table_status",
      key: "table_status",
      render: (status: string) => {
        const colors: { [key: string]: string } = {
          Completed: "green",
          Reserved: "orange",
          Canceled: "red",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },

    {
      title: "Status Reservation",
      dataIndex: "reservation_status",
      key: "reservation_status",
      render: (reservation_status: string) => (
        <Tag color="red">{reservation_status}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ArchivedReservation) => (
        <Tooltip title="Restore Reservation">
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => handleRestore(record.reservation_id)}
          >
            Restore
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      title="Archived Reservations"
      open={isArchivedModalVisible}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{ maxWidth: "1100px" }}
    >
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table
          dataSource={archivedReservations}
          columns={columns}
          rowKey="reservation_id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: true }}
        />
      )}
    </Modal>
  );
};

export default ArchiveReservationModal;
