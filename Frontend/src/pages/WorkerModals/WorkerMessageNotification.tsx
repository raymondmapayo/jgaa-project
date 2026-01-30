import { Avatar, List, Tag, Spin } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Notification {
  id: number; // sender_id
  title?: string;
  description: string;
  time: string;
  profile_pic: string;
  is_read: string; // "read" or "unread"
}

interface Props {
  apiUrl: string;
  userId: string | null;
  onUnreadCountChange?: (count: number) => void;
  onCloseDropdown?: () => void;
}

const MessageNotification: React.FC<Props> = ({
  apiUrl,
  userId,
  onUnreadCountChange,
  onCloseDropdown,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true; // prevent state update if component unmounted
    let isFetching = false; // prevent overlapping fetches

    const fetchNotifications = async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        const res = await axios.get(`${apiUrl}/worker_notifications/${userId}`);

        const data: Notification[] = res.data.map((item: any) => ({
          id: item.id,
          title: item.title || "Message",
          description: item.description,
          time: item.time,
          profile_pic: item.profile_pic || "",
          is_read: item.is_read?.toLowerCase() === "read" ? "read" : "unread",
        }));

        if (isMounted) {
          setNotifications(data);

          // Update unread badge count
          const unread = data.filter((n) => n.is_read !== "read").length;
          onUnreadCountChange?.(unread);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        isFetching = false;
        if (isMounted) setLoading(false);
      }
    };

    // Initial fetch
    setLoading(true);
    fetchNotifications();

    // Poll every 5 seconds
    const intervalId = setInterval(fetchNotifications, 5000);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [apiUrl, userId, onUnreadCountChange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-36">
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
      <List
        size="small"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            key={item.id + item.time}
            className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer ${
              item.is_read === "read"
                ? "opacity-50"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => {
              navigate("/Worker/Manage/Chats", {
                state: { selectedUserId: item.id },
              });
              onCloseDropdown?.();
            }}
          >
            <Avatar
              className="w-10 h-10 md:w-12 md:h-12"
              src={
                item.profile_pic
                  ? `${apiUrl}/uploads/images/${item.profile_pic}`
                  : "/avatar.jpg"
              }
            />

            <div className="flex flex-col flex-1">
              <span className="text-xs sm:text-sm md:text-base">
                {item.title}
                {item.is_read === "read" ? (
                  <Tag color="green" style={{ marginLeft: "auto" }}>
                    Read
                  </Tag>
                ) : (
                  <Tag color="red" style={{ marginLeft: "auto" }}>
                    Unread
                  </Tag>
                )}
              </span>

              <p className="text-xs sm:text-sm line-clamp-2">
                {item.description}
              </p>
              <span className="text-xs text-gray-400">
                {dayjs(item.time).format("YYYY-MM-DD h:mm A")}
              </span>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default MessageNotification;
