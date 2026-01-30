import React, { useState } from "react";
import { Badge, Tabs } from "antd";
import MessageNotification from "./WorkerMessageNotification";
import AlarmNotification from "./WorkerNotificationAlarm";
import AnnouncementNotification from "./AnnouncementNotification";

interface AllNotificationsProps {
  apiUrl: string;

  onCloseDropdown?: () => void; // new prop
  onSelectUser?: (user: any) => void; // ← add this
}

const AllNotifications: React.FC<AllNotificationsProps> = ({
  apiUrl,
  onCloseDropdown,
}) => {
  const [announcementCount, setAnnouncementCount] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0); // 👈 ADD THIS
  return (
    <div className="w-full max-w-[380px] max-h-[70vh] bg-white dark:bg-[#0f172a] rounded-lg shadow-lg overflow-hidden">
      <Tabs
        size="small"
        className="px-1 sm:px-2 md:px-3"
        items={[
          {
            key: "alarm",
            label: <span className="pl-1 sm:pl-2 md:pl-4">Alerts</span>,
            children: <AlarmNotification />,
          },
          {
            key: "messages",
            label: (
              <Badge
                count={messageCount}
                size="small"
                color="#ff4d4f"
                offset={[6, -2]}
              >
                <span className="text-xs sm:text-sm md:text-base">
                  Messages
                </span>
              </Badge>
            ),
            children: (
              <MessageNotification
                apiUrl={apiUrl}
                userId={sessionStorage.getItem("user_id")}
                onUnreadCountChange={setMessageCount}
                onCloseDropdown={onCloseDropdown}
              />
            ),
            forceRender: true,
          },
          {
            key: "announcements",
            label: (
              <Badge
                count={announcementCount}
                size="small"
                color="#ff4d4f"
                offset={[6, -2]}
              >
                <span className="text-xs sm:text-sm md:text-base">
                  Announcements
                </span>
              </Badge>
            ),
            children: (
              <AnnouncementNotification
                apiUrl={apiUrl}
                userId={sessionStorage.getItem("user_id")}
                onUnreadCountChange={setAnnouncementCount}
                onCloseDropdown={onCloseDropdown} // pass down
              />
            ),
            forceRender: true, // ← add this line
          },
        ]}
      />
    </div>
  );
};

export default AllNotifications;
