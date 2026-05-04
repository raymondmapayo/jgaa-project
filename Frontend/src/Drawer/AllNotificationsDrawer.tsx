import React, { useState } from "react";
import { Badge, Tabs, Drawer } from "antd";
import AnnouncementNotification from "../pages/WorkerModals/AnnouncementNotification";
import MessageNotification from "../pages/WorkerModals/WorkerMessageNotification";
import AlarmNotification from "../pages/WorkerModals/WorkerNotificationAlarm";

interface AllNotificationsDrawerProps {
  apiUrl: string;
  open: boolean;
  onClose: () => void;
}

const AllNotificationsDrawer: React.FC<AllNotificationsDrawerProps> = ({
  apiUrl,
  open,
  onClose,
}) => {
  const [announcementCount, setAnnouncementCount] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0);

  const handleViewAll = () => {
    console.log("Navigate to all notifications page");
    onClose();
    // navigate("/all-notifications");
  };

  return (
    <Drawer
      title="Notifications"
      placement="right"
      open={open}
      onClose={onClose}
      width={380}
      mask
      maskStyle={{ backgroundColor: "transparent" }}
      // 🔴 CHANGE #1 (IMPORTANT)
      bodyStyle={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      zIndex={2000}
    >
      {/* 🔴 CHANGE #2 (wrapper layout fix) */}
      <div
        className="w-full max-w-[380px] bg-white dark:bg-[#0f172a]"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // 🔥 prevents body scroll breaking
        }}
      >
        {/* 🔴 CHANGE #3 (make tabs scrollable area) */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
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
                    onCloseDropdown={onClose} // 🔥 ADD THIS
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
                    onCloseDropdown={onClose} // 🔥 ADD THIS
                  />
                ),
                forceRender: true,
              },
            ]}
          />
        </div>

        {/* FOOTER - VIEW ALL (NO CHANGE except one line added) */}
        <div
          style={{
            backgroundColor: "#fff",
            borderTop: "1px solid #eee",
            padding: "12px 16px",
            textAlign: "center",

            // 🔴 CHANGE #4 (IMPORTANT STICKY FIX)
            flexShrink: 0,
          }}
        >
          <div
            onClick={handleViewAll}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1890ff",
              cursor: "pointer",
              borderRadius: 6,
              padding: "6px 0",
              transition: "0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f5f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            View All Notifications
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default AllNotificationsDrawer;
