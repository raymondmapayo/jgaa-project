import React, { useEffect, useState } from "react";
import { List, Avatar, Spin, Typography, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

const { Text } = Typography;

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
  onCloseDropdown?: () => void; // new
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
          `${apiUrl}/get_notifications_announcement/${userId}`
        );

        setAnnouncements(response.data);

        // Calculate unread count
        const unread = response.data.filter(
          (item: Announcement) => item.status === "unread"
        ).length;

        // Send count to parent
        onUnreadCountChange?.(unread);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [userId, apiUrl, onUnreadCountChange]);

  if (loading) return <Spin tip="Loading announcements..." />;

  return (
    <List
      itemLayout="horizontal"
      dataSource={announcements}
      renderItem={(announcement) => (
        <Link
          to={`/worker-announcement`}
          state={{ announcement }} // optional: pass the full object
          style={{ textDecoration: "none", color: "inherit" }}
          onClick={() => onCloseDropdown?.()} // ← close dropdown
        >
          <List.Item
            className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer ${
              announcement.status === "read"
                ? "opacity-50"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                  src={
                    announcement.sender_profile_pic
                      ? `${apiUrl}/uploads/images/${announcement.sender_profile_pic}`
                      : "/avatar.jpg"
                  }
                  alt={announcement.sender_name}
                />
              }
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Text strong>
                    {announcement.title} -{" "}
                    <Text type="secondary">
                      {dayjs(announcement.created_at).format(
                        "MMM D, YYYY h:mm A"
                      )}
                    </Text>
                  </Text>
                  {announcement.status === "read" ? (
                    <Tag color="green" style={{ marginLeft: "auto" }}>
                      Read
                    </Tag>
                  ) : (
                    <Tag color="red" style={{ marginLeft: "auto" }}>
                      Unread
                    </Tag>
                  )}
                </div>
              }
              description={announcement.message}
            />
          </List.Item>
        </Link>
      )}
    />
  );
};

export default AnnouncementNotification;
