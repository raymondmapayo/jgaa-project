import React, { useEffect, useState, useRef } from "react";
import { List, Spin, Button, Avatar, message as antdMessage } from "antd";
import axios from "axios";
import dayjs from "dayjs";

// Alarm notification type
type AlarmNotification = {
  notification_id: number;
  message: string;
  status: "unread" | "read";
  created_at: string;
};

// Message notification type
type MessageNotification = {
  id: number;
  title?: string;
  description: string;
  time: string;
  profile_pic: string;
  status: "read" | "unread";
};

interface NotificationsProps {
  apiUrl: string;
}

const Notifications: React.FC<NotificationsProps> = ({ apiUrl }) => {
  const [alarms, setAlarms] = useState<AlarmNotification[]>([]);
  const [messages, setMessages] = useState<MessageNotification[]>([]);
  const [loadingAlarms, setLoadingAlarms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAlarms = async () => {
    try {
      setLoadingAlarms(true);
      const res = await axios.get(`${apiUrl}/notifications`);
      const allAlarms: AlarmNotification[] = res.data;
      const lowStock = allAlarms.filter((n) =>
        n.message.toLowerCase().includes("low on stock")
      );
      setAlarms(lowStock);

      // Play sound for unread alarms
      const unreadIds = lowStock
        .filter((n) => n.status === "unread")
        .map((n) => n.notification_id);

      if (unreadIds.length > 0 && audioRef.current) {
        audioRef.current.play();
        await axios.all(
          unreadIds.map((id) =>
            axios.post(`${apiUrl}/notifications/read/${id}`)
          )
        );
        setAlarms((prev) => prev.map((n) => ({ ...n, status: "read" })));
      }
    } catch (error) {
      console.error(error);
      antdMessage.error("Failed to fetch alarms.");
    } finally {
      setLoadingAlarms(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const res = await axios.get(
        `${apiUrl}/get_notifications_for_worker/${sessionStorage.getItem(
          "user_id"
        )}`
      );
      setMessages(res.data);
    } catch (error) {
      console.error(error);
      antdMessage.error("Failed to fetch messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
    fetchMessages();
    const interval = setInterval(() => {
      fetchAlarms();
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="w-80 max-h-[400px] overflow-y-auto bg-white dark:bg-[#0f172a] rounded-lg shadow-lg p-2 relative">
      <Button
        size="small"
        onClick={stopAudio}
        style={{ position: "absolute", top: 8, right: 8, zIndex: 1000 }}
      >
        Stop
      </Button>
      <audio ref={audioRef} src="/alarm.mp3" />

      {/* Alarm Notifications */}
      <h4 className="px-2 font-medium text-gray-700 dark:text-gray-200">
        Alarms
      </h4>
      {loadingAlarms ? (
        <div className="flex justify-center py-4">
          <Spin />
        </div>
      ) : alarms.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No alarms
        </p>
      ) : (
        <List
          size="small"
          dataSource={alarms}
          renderItem={(item) => (
            <List.Item
              className={`px-2 py-1 ${
                item.status === "unread"
                  ? "bg-yellow-50 dark:bg-yellow-900"
                  : ""
              }`}
            >
              <List.Item.Meta
                title={<span className="text-sm">{item.message}</span>}
                description={
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {dayjs(item.created_at).format("YYYY-MM-DD h:mm A")}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}

      <hr className="my-2 border-gray-300 dark:border-gray-700" />

      {/* Message Notifications */}
      <h4 className="px-2 font-medium text-gray-700 dark:text-gray-200">
        Messages
      </h4>
      {loadingMessages ? (
        <div className="flex justify-center py-4">
          <Spin />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No messages
        </p>
      ) : (
        <List
          size="small"
          dataSource={messages}
          renderItem={(item) => (
            <List.Item
              className={`flex items-start gap-2 px-2 py-1 rounded ${
                item.status === "read"
                  ? "opacity-50"
                  : "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Avatar
                size={32}
                src={
                  item.profile_pic
                    ? `${apiUrl}/uploads/images/${item.profile_pic}`
                    : "/avatar.jpg"
                }
              />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-gray-800 dark:text-blue-100">
                  {item.title || "Message"}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {item.description}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {dayjs(item.time).format("YYYY-MM-DD h:mm A")}
                </span>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default Notifications;
