import { Avatar, List, Tag, Spin } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // ✅ ADD THIS
import axios from "axios";

interface Notification {
  id: number;
  title?: string;
  description: string;
  time: string;
  profile_pic: string;
  is_read: string;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    let isFetching = false;

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

    setLoading(true);
    fetchNotifications();

    const intervalId = setInterval(fetchNotifications, 5000);

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
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingRight: 4,
        minHeight: 0,
      }}
    >
      <List
        size="small"
        dataSource={notifications}
        renderItem={(item) => (
          <Link
            to="/Worker/Manage/Chats"
            state={{ selectedUserId: item.id }}
            onClick={() => onCloseDropdown?.()} // ✅ CLOSE DRAWER ON CLICK
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <List.Item
              key={item.id + item.time}
              style={{
                paddingLeft: 0,
                paddingRight: 8,
                alignItems: "flex-start",
              }}
              className={`flex items-start cursor-pointer ${
                item.is_read === "read"
                  ? "bg-gray-50 dark:bg-gray-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Avatar
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                src={
                  item.profile_pic
                    ? item.profile_pic.startsWith("http")
                      ? item.profile_pic
                      : `${apiUrl}/uploads/images/${item.profile_pic}`
                    : "/avatar.jpg"
                }
                style={{
                  imageRendering: "crisp-edges",
                }}
              />

              {/* CONTENT */}
              <div className="flex flex-col flex-1 min-w-0 pl-2">
                <div className="flex items-start justify-between w-full text-black dark:text-white">
                  <span className="text-sm md:text-base font-bold break-words text-black dark:text-white">
                    {item.title}
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-black dark:text-gray-300 whitespace-nowrap">
                      {dayjs(item.time).format("MMM DD, h:mm A")}
                    </span>

                    {item.is_read === "read" ? (
                      <Tag color="green" className="m-0">
                        Read
                      </Tag>
                    ) : (
                      <Tag color="red" className="m-0">
                        Unread
                      </Tag>
                    )}
                  </div>
                </div>

                <p className="text-base font-medium text-gray-800 dark:text-gray-300 mt-1 leading-relaxed break-words">
                  {item.description}
                </p>
              </div>
            </List.Item>
          </Link>
        )}
      />
    </div>
  );
};

export default MessageNotification;
