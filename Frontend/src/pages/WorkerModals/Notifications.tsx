import React, { useEffect, useState, useRef } from "react";

import {
  List,
  Spin,
  Button,
  Avatar,
  message as antdMessage,
  Drawer,
} from "antd";

import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

type AlarmNotification = {
  notification_id: number;
  message: string;
  status: "unread" | "read";
  created_at: string;
};

type MessageNotification = {
  id: number;
  sender_id: number;
  title?: string;
  description: string;
  time: string;
  profile_pic: string;
  status: "read" | "unread";
};

interface NotificationsProps {
  apiUrl: string;
  open: boolean;
  onClose: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  apiUrl,
  open,
  onClose,
}) => {
  const [alarms, setAlarms] = useState<AlarmNotification[]>([]);

  const [messages, setMessages] = useState<MessageNotification[]>([]);

  const [loadingAlarms, setLoadingAlarms] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAlarms = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingAlarms(true);
      }

      const res = await axios.get(`${apiUrl}/notifications`);

      const allAlarms: AlarmNotification[] = res.data;

      const lowStock = allAlarms.filter((n) =>
        n.message.toLowerCase().includes("low on stock"),
      );

      setAlarms(lowStock);

      const unreadIds = lowStock
        .filter((n) => n.status === "unread")
        .map((n) => n.notification_id);

      if (unreadIds.length > 0 && audioRef.current) {
        try {
          await audioRef.current.play();
        } catch (audioError) {
          console.log("Audio could not play:", audioError);
        }

        await Promise.all(
          unreadIds.map((id) =>
            axios.post(`${apiUrl}/notifications/read/${id}`),
          ),
        );

        setAlarms((prev) =>
          prev.map((n) => ({
            ...n,
            status: "read",
          })),
        );
      }
    } catch (error) {
      console.error(error);

      antdMessage.error("Failed to fetch alarms.");
    } finally {
      if (showLoading) {
        setLoadingAlarms(false);
      }
    }
  };

  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingMessages(true);
      }

      const userId = sessionStorage.getItem("user_id");

      if (!userId) {
        setMessages([]);
        return;
      }

      const res = await axios.get(
        `${apiUrl}/get_notifications_for_worker/${userId}`,
      );

      const formattedMessages: MessageNotification[] = res.data.map(
        (item: any) => ({
          id: item.id,

          sender_id: item.sender_id,

          title: item.user_name || "Message",

          description: item.description,

          time: item.time,

          profile_pic: item.profile_pic || "",

          status: item.is_read?.toLowerCase() === "read" ? "read" : "unread",
        }),
      );

      setMessages(formattedMessages);
    } catch (error) {
      console.error(error);

      antdMessage.error("Failed to fetch messages.");
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    if (!open) return;

    fetchAlarms();
    fetchMessages();

    const onFocus = () => {
      fetchAlarms(false);
      fetchMessages(false);
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [open, apiUrl]);

  const handleMessageClick = async (senderId: number) => {
    const workerId = sessionStorage.getItem("user_id");

    if (!workerId) return;

    try {
      // UPDATE DATABASE
      await axios.post(`${apiUrl}/messages/read/${workerId}/${senderId}`);

      // UPDATE UI
      setMessages((prev) =>
        prev.map((item) =>
          item.sender_id === senderId
            ? {
                ...item,
                status: "read",
              }
            : item,
        ),
      );

      console.log("Message marked as read:", {
        workerId,
        senderId,
      });

      onClose();
    } catch (error) {
      console.error("Failed to mark message as read:", error);

      antdMessage.error("Failed to mark message as read.");
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();

      audioRef.current.currentTime = 0;
    }
  };

  return (
    <Drawer
      title="Notifications"
      placement="right"
      onClose={onClose}
      open={open}
      width={360}
      bodyStyle={{
        padding: 0,
        background: "#0f172a",
      }}
    >
      <div className="h-full overflow-y-auto p-2 text-white">
        <Button
          size="small"
          onClick={stopAudio}
          style={{
            position: "absolute",
            top: 10,
            right: 50,
            zIndex: 1000,
          }}
        >
          Stop
        </Button>

        <audio ref={audioRef} src="/alarm.mp3" />

        {/* ========================= */}
        {/* ALARMS */}
        {/* ========================= */}

        <h4 className="px-2 font-medium text-gray-300">Alarms</h4>

        {loadingAlarms ? (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        ) : alarms.length === 0 ? (
          <p className="text-center text-gray-400">No alarms</p>
        ) : (
          <List
            size="small"
            dataSource={alarms}
            renderItem={(item) => (
              <List.Item
                className={`px-2 py-2 rounded ${
                  item.status === "unread"
                    ? "bg-yellow-900/40"
                    : "bg-transparent"
                }`}
              >
                <List.Item.Meta
                  title={
                    <span className="text-sm text-white">{item.message}</span>
                  }
                  description={
                    <span className="text-xs text-gray-400">
                      {dayjs(item.created_at).format("YYYY-MM-DD h:mm A")}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}

        <hr className="my-3 border-gray-700" />

        {/* ========================= */}
        {/* MESSAGES */}
        {/* ========================= */}

        <h4 className="px-2 font-medium text-gray-300">Messages</h4>

        {loadingMessages ? (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400">No messages</p>
        ) : (
          <List
            size="small"
            dataSource={messages}
            renderItem={(item) => (
              <Link
                to="/Worker/Manage/Chats"
                state={{
                  selectedUserId: item.sender_id,
                }}
                onClick={() => {
                  handleMessageClick(item.sender_id);
                }}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <List.Item
                  key={item.id}
                  className={`flex items-start gap-2 px-2 py-2 rounded transition cursor-pointer ${
                    item.status === "read" ? "opacity-40" : "hover:bg-gray-800"
                  }`}
                >
                  <Avatar
                    size={36}
                    src={
                      item.profile_pic
                        ? item.profile_pic.startsWith("http")
                          ? item.profile_pic
                          : `${apiUrl}/uploads/images/${item.profile_pic}`
                        : "/avatar.jpg"
                    }
                  />

                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-blue-100">
                      {item.title || "Message"}
                    </span>

                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      {item.description}
                    </p>

                    <span className="text-xs text-gray-500 mt-1">
                      {dayjs(item.time).format("YYYY-MM-DD h:mm A")}
                    </span>

                    <span
                      className={`text-xs mt-1 ${
                        item.status === "read"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.status === "read" ? "Read" : "Unread"}
                    </span>
                  </div>
                </List.Item>
              </Link>
            )}
          />
        )}
      </div>
    </Drawer>
  );
};

export default Notifications;
