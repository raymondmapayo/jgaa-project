import React, { useEffect, useState } from "react";
import { List, Avatar, Spin, Typography, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

interface Announcement {
  announcement_id: number;
  title: string;
  message: string;
  sender_id: number;
  recipient_id: number;
  created_at: string;
  status: string;
  sender_profile_pic: string;
  sender_name: string;
}

interface Props {
  userId: string | null;
  apiUrl: string;
  onUnreadCountChange?: (count: number) => void;
  onCloseDropdown?: () => void;
}

const AnnouncementNotification: React.FC<Props> = ({
  userId,
  apiUrl,
  onUnreadCountChange,
  onCloseDropdown,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;

    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/get_notifications_announcement/${userId}`,
        );

        setAnnouncements(response.data);

        const unread = response.data.filter(
          (item: Announcement) => item.status === "unread",
        ).length;

        onUnreadCountChange?.(unread);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [userId, apiUrl, onUnreadCountChange]);

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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <List
          itemLayout="horizontal"
          dataSource={announcements}
          renderItem={(announcement) => (
            <Link
              to="/worker-announcement"
              state={{ announcement }}
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={() => onCloseDropdown?.()}
            >
              <List.Item
                style={{
                  paddingLeft: 0,
                  paddingRight: 8,
                  alignItems: "flex-start",
                }}
                className={`flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer ${
                  announcement.status === "read"
                    ? "bg-gray-50 dark:bg-gray-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Avatar
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                  src={
                    announcement.sender_profile_pic
                      ? announcement.sender_profile_pic.startsWith("http")
                        ? announcement.sender_profile_pic
                        : `${apiUrl}/uploads/images/${announcement.sender_profile_pic}`
                      : "/avatar.jpg"
                  }
                />

                {/* CONTENT */}
                <div className="flex flex-col flex-1 min-w-0 pl-2">
                  {/* TOP ROW */}
                  <div className="flex items-start justify-between w-full">
                    {/* TITLE */}
                    <span className="text-sm md:text-base font-bold text-black dark:text-white break-words">
                      {announcement.title}
                    </span>

                    {/* RIGHT SIDE */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {dayjs(announcement.created_at).format(
                          "MMM DD, h:mm A",
                        )}
                      </span>

                      {announcement.status === "read" ? (
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

                  {/* DESCRIPTION */}
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mt-1 leading-relaxed break-words">
                    {announcement.message}
                  </p>
                </div>
              </List.Item>
            </Link>
          )}
        />
      </div>
    </div>
  );
};

export default AnnouncementNotification;
