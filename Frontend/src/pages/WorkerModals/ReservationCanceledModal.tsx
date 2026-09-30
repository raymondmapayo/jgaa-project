import React, { useEffect, useState } from "react";
import { Modal, Button, Typography, notification } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Text } = Typography;

interface Reservation {
  reservation_id: number;
  reservation_date: string;
  reservation_time: string;
  table_status?: string;
  full_name?: string;
  [key: string]: any;
}

interface ReservationCanceledModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onUpdateReservation?: (updated: Reservation) => void;
}

const ReservationCanceledModal: React.FC<ReservationCanceledModalProps> = ({
  visible,
  onClose,
  reservation,
  onUpdateReservation,
}) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Automatically cancel reservation
  const canceledNow = async (id: number) => {
    if (!reservation || reservation.reservation_id !== id) {
      return;
    }

    const full_name =
      sessionStorage.getItem("full_name") || reservation.full_name;

    try {
      setIsProcessing(true);

      await axios.put(
        `${apiUrl}/update_reservation_canceled_status/${id}`,
        {
          table_status: "Canceled",
          full_name,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      notification.success({
        message: "Reservation Canceled",
        description: `Reservation #${id} for ${
          full_name || "customer"
        } marked as Canceled.`,
      });

      onUpdateReservation?.({
        ...reservation,
        table_status: "Canceled",
      });

      setTimeLeftSeconds(0);
      onClose();
    } catch (err: any) {
      console.error("Error canceling reservation:", err);

      notification.error({
        message: "Failed",
        description:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not mark reservation as Canceled. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start countdown when modal opens
  useEffect(() => {
    if (!visible || !reservation) {
      return;
    }

    // Already canceled
    if (reservation.table_status === "Canceled") {
      setTimeLeftSeconds(0);
      return;
    }

    // Start from 10 seconds
    setTimeLeftSeconds(10);

    const intervalId = window.setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);

          // Automatically cancel when countdown reaches 0
          canceledNow(reservation.reservation_id);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    // Cleanup when modal closes or reservation changes
    return () => {
      window.clearInterval(intervalId);
    };
  }, [visible, reservation]);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");

    const seconds = (secs % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  const formattedDate = reservation
    ? dayjs(reservation.reservation_date).format("MMMM D, YYYY")
    : "";

  const formattedTime = reservation
    ? dayjs(reservation.reservation_time, ["HH:mm", "HH:mm:ss"]).format(
        "hh:mm A",
      )
    : "";

  return (
    <Modal
      title="Reservation Cancellation"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
    >
      {reservation ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Full Name: </Text>
            <Text>{reservation.full_name ?? "-"}</Text>
            <br />

            <Text strong>Date: </Text>
            <Text>{formattedDate}</Text>
            <br />

            <Text strong>Time: </Text>
            <Text>{formattedTime}</Text>
            <br />

            <Text strong>Current status: </Text>
            <Text>{reservation.table_status ?? "-"}</Text>
          </div>

          {timeLeftSeconds > 0 && (
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
              }}
            >
              <Text
                strong
                style={{
                  fontSize: 24,
                  color: "#fa8c16",
                }}
              >
                {formatTime(timeLeftSeconds)}
              </Text>

              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Countdown running — reservation will automatically cancel at
                  00:00
                </Text>
              </div>

              <div style={{ marginTop: 12 }}>
                <Button
                  danger
                  onClick={() => {
                    setTimeLeftSeconds(0);
                  }}
                  disabled={isProcessing}
                >
                  Cancel Countdown
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Text>No reservation selected.</Text>
      )}
    </Modal>
  );
};

export default ReservationCanceledModal;
