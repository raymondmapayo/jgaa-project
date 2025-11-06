import { Avatar, List } from "antd";
import dayjs from "dayjs";
import React from "react";

// Notification type
interface Notification {
  id: number;
  title?: string;
  description: string;
  time: string;
  profile_pic: string;
  status: string;
}

interface WorkerNotificationModalProps {
  notifications: Notification[];
  apiUrl: string;
}

const WorkerNotificationModal: React.FC<WorkerNotificationModalProps> = ({
  notifications,
  apiUrl,
}) => {
  return (
    <div
      className="max-h-[300px] w-72 sm:w-80 md:w-96 lg:w-112 xl:w-128 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 bg-white dark:bg-[#0f172a] dark:text-white rounded-lg shadow-lg"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#fa8c16 #f0f0f0",
      }}
    >
      <List
        size="small"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            className={`flex items-start gap-3 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 ${
              item.status === "read"
                ? "opacity-50"
                : "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {/* Avatar on the left */}
            <Avatar
              size={40}
              src={
                item.profile_pic
                  ? `${apiUrl}/uploads/images/${item.profile_pic}`
                  : "/avatar.jpg"
              }
            />

            {/* Text content on the right */}
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-gray-800 dark:text-blue-100">
                {item.title || "Message"}
              </span>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                {item.description}
              </p>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {dayjs(item.time).format("YYYY-MM-DD h:mm A")}
              </span>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default WorkerNotificationModal;
