import React, { useEffect, useState, useRef } from "react";
import { List, Spin, Button, message } from "antd";
import axios from "axios";
import dayjs from "dayjs";

type Notification = {
  notification_id: number;
  message: string;
  status: "unread" | "read";
  created_at: string;
};

type WorkerNotificationAlarmProps = {};

const WorkerNotificationAlarm: React.FC<WorkerNotificationAlarmProps> = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/notifications`);
      const allNotifications: Notification[] = response.data;

      // Filter only "Low on stock" messages
      const lowStockNotifications = response.data.filter((n: Notification) =>
        n.message.toLowerCase().includes("low on stock")
      );

      setNotifications(lowStockNotifications);

      const unreadIds = allNotifications
        .filter((n: Notification) => n.status === "unread")
        .map((n: Notification) => n.notification_id);

      if (unreadIds.length > 0) {
        if (audioRef.current) audioRef.current.play();

        await axios.all(
          unreadIds.map((id: number) =>
            axios.post(`${apiUrl}/notifications/read/${id}`)
          )
        );

        setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      }
    } catch (error) {
      console.error("Error fetching or marking notifications:", error);
      message.error("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div
      style={{
        padding: 8,
        zIndex: 999,
        position: "relative",
        width: "100%",
        maxWidth: 380,
        maxHeight: "70vh",
      }}
    >
      {/* Stop button */}
      <Button
        size="small"
        onClick={stopAudio}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 1000,
        }}
      >
        Stop
      </Button>

      <audio ref={audioRef} src="/alarm.mp3" />

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">
          No low/out-of-stock notifications.
        </p>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={<span>{item.message}</span>}
                  description={dayjs(item.created_at).format(
                    "YYYY-MM-DD h:mm A"
                  )}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default WorkerNotificationAlarm;
