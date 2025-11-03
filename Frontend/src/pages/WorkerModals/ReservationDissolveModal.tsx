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

interface ReservationDissolveModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onUpdateReservation?: (updated: Reservation) => void;
}

// ✅ Global countdown state
const globalCountdowns: Record<number, number> = {};
let globalInterval: number | null = null;

const ReservationDissolveModal: React.FC<ReservationDissolveModalProps> = ({
  visible,
  onClose,
  reservation,
  onUpdateReservation,
}) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Initialize countdown for a reservation
  const initCountdown = (id: number) => {
    if (globalCountdowns[id] === undefined) {
      const saved = sessionStorage.getItem(`countdown_${id}`);
      globalCountdowns[id] = saved && Number(saved) > 0 ? Number(saved) : 10;
    }
    setTimeLeftSeconds(globalCountdowns[id]);

    // Start the global ticking interval if not already
    if (globalInterval === null) {
      globalInterval = window.setInterval(() => {
        Object.keys(globalCountdowns).forEach((key) => {
          const k = Number(key);
          globalCountdowns[k] -= 1;
          sessionStorage.setItem(
            `countdown_${k}`,
            globalCountdowns[k].toString()
          );
          // ✅ Trigger React update only if this modal is for this reservation
          if (reservation && reservation.reservation_id === k) {
            setTimeLeftSeconds(globalCountdowns[k]);
          }

          if (globalCountdowns[k] <= 0) {
            delete globalCountdowns[k];
            sessionStorage.removeItem(`countdown_${k}`);
            dissolveNow(k);
          }
        });

        // Stop global interval if no countdowns left
        if (
          Object.keys(globalCountdowns).length === 0 &&
          globalInterval !== null
        ) {
          clearInterval(globalInterval);
          globalInterval = null;
        }
      }, 1000);
    }
  };

  // Dissolve reservation immediately
  const dissolveNow = async (id: number) => {
    if (!reservation || reservation.reservation_id !== id) return;

    const full_name =
      sessionStorage.getItem("full_name") || reservation.full_name;

    try {
      setIsProcessing(true);

      await axios.put(
        `${apiUrl}/update_reservation_dissolve_status/${id}`,
        { table_status: "Dissolve", full_name },
        { headers: { "Content-Type": "application/json" } }
      );

      notification.success({
        message: "Reservation Dissolved",
        description: `Reservation #${id} for ${full_name} marked as Dissolve.`,
      });

      onUpdateReservation?.({ ...reservation, table_status: "Dissolve" });

      setTimeLeftSeconds(0);
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      notification.error({
        message: "Failed",
        description:
          err.response?.data?.message ||
          "Could not mark reservation as Dissolve. Please try again.",
      });
      setIsProcessing(false);
    }
  };

  // ✅ Initialize countdown when modal opens
  useEffect(() => {
    if (!reservation || !visible) return;

    if (reservation.table_status === "Dissolve") {
      setTimeLeftSeconds(0);
      return;
    }

    initCountdown(reservation.reservation_id);
  }, [reservation, visible]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formattedDate = reservation
    ? dayjs(reservation.reservation_date).format("MMMM D, YYYY")
    : "";
  const formattedTime = reservation
    ? dayjs(reservation.reservation_time, ["HH:mm", "HH:mm:ss"]).format(
        "hh:mm A"
      )
    : "";

  return (
    <Modal
      title="Reservation Dissolve"
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
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Text strong style={{ fontSize: 24, color: "#fa8c16" }}>
                {formatTime(timeLeftSeconds)}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Countdown running — reservation will automatically dissolve at
                  00:00
                </Text>
              </div>
              <div style={{ marginTop: 12 }}>
                <Button
                  danger
                  onClick={() => {
                    if (reservation) {
                      const id = reservation.reservation_id;
                      delete globalCountdowns[id];
                      sessionStorage.removeItem(`countdown_${id}`);
                      setTimeLeftSeconds(0);
                    }
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

export default ReservationDissolveModal;
