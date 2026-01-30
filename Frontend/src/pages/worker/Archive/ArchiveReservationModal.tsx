import { UploadOutlined } from "@ant-design/icons";
import { Button, Modal, Table, Tooltip, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

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
    let isMounted = true;

    const fetchArchivedReservations = async () => {
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
        if (isMounted) setIsLoading(false);
      }
    };

    // initial fetch
    fetchArchivedReservations();

    // fetch every 10 seconds
    const interval = setInterval(fetchArchivedReservations, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl]);

  const handleRestore = async (reservation_id: number) => {
    Modal.confirm({
      title: "Restore reservation?",
      content: "This reservation will be restored to active list.",
      okText: "Yes, Restore",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.put(`${apiUrl}/restore_reservation/${reservation_id}`);

          setArchivedReservations((prev) =>
            prev.filter((item) => item.reservation_id !== reservation_id)
          );

          // Refresh main table
          if (onRestore) onRestore();
        } catch (error) {
          console.error("Error restoring reservation:", error);
        }
      },
    });
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
