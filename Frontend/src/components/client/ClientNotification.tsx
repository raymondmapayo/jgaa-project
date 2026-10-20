import { Badge, notification, Popover } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useCallback, useEffect, useState } from "react";
import { FaBell, FaCheckDouble } from "react-icons/fa";

dayjs.extend(relativeTime);

interface Notification {
  client_notification_id: number;
  message: string;
  created_at: string;
  status: string; // "unread" or "read"
  sender_id: number;
}

interface ClientNotificationProps {
  asTextButton?: boolean; // true = "Notifications" menu row, false = bell icon
}

type Tab = "All" | "Unread";

const POLL_MS = 10000; // was 1000ms; 10s is plenty and far lighter on your server

const ClientNotification: React.FC<ClientNotificationProps> = ({
  asTextButton,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [tab, setTab] = useState<Tab>("All");

  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
  const userId = Number(sessionStorage.getItem("user_id"));
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${apiUrl}/client_notifications/${userId}`);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, userId]);

  // Poll, but pause while the browser tab is hidden
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const markRead = async (id: number) => {
    const target = notifications.find((n) => n.client_notification_id === id);
    if (!target || target.status === "read") return;

    setNotifications((prev) =>
      prev.map((n) =>
        n.client_notification_id === id ? { ...n, status: "read" } : n,
      ),
    );
    try {
      await axios.post(`${apiUrl}/client_notifications/read/${id}`);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => n.status === "unread");
    if (unread.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
    await Promise.allSettled(
      unread.map((n) =>
        axios.post(
          `${apiUrl}/client_notifications/read/${n.client_notification_id}`,
        ),
      ),
    );
  };

  const handleOpenChange = (visible: boolean) => {
    if (visible && !isAuthenticated) {
      notification.info({
        key: "auth-required-notif",
        message: "Log in to see notifications",
        description: "Please log in first to view your notifications.",
        placement: "topRight",
        duration: 2,
      });
      return;
    }
    setPopoverVisible(visible);
  };

  const shown =
    tab === "Unread"
      ? notifications.filter((n) => n.status === "unread")
      : notifications;

  const content = (
    <div className="font-core w-[min(360px,calc(100vw-32px))]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-base font-semibold text-stone-900">
          Notifications
        </h2>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
        >
          <FaCheckDouble /> Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-100 px-4 pb-3">
        {(["All", "Unread"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
              tab === t
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t}
            {t === "Unread" && unreadCount > 0 && (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  tab === t ? "bg-white/20" : "bg-orange-500 text-white"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-stone-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-5/6 rounded bg-stone-200" />
                  <div className="h-3 w-1/4 rounded bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500">
              <FaBell />
            </div>
            <p className="font-semibold text-stone-900">
              {tab === "Unread"
                ? "You're all caught up"
                : "No notifications yet"}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {tab === "Unread"
                ? "New updates about your orders will show up here."
                : "Updates about your orders will show up here."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {shown.map((item) => {
              const unread = item.status === "unread";
              return (
                <li key={item.client_notification_id}>
                  <button
                    onClick={() => markRead(item.client_notification_id)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-stone-50 focus:outline-none focus-visible:bg-stone-50 ${
                      unread ? "bg-orange-50/60" : ""
                    }`}
                  >
                    <span
                      aria-label={unread ? "Unread" : "Read"}
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        unread
                          ? "bg-orange-500"
                          : "bg-transparent ring-1 ring-stone-300"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${
                          unread
                            ? "font-medium text-stone-900"
                            : "text-stone-500"
                        }`}
                      >
                        {item.message}
                      </span>
                      <span
                        className="mt-1 block text-xs text-stone-400"
                        title={dayjs(item.created_at).format(
                          "MMM D, YYYY, h:mm A",
                        )}
                      >
                        {dayjs(item.created_at).fromNow()}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={popoverVisible}
      onOpenChange={handleOpenChange}
      arrow={false}
      overlayInnerStyle={{ padding: 0, borderRadius: 16, overflow: "hidden" }}
    >
      {asTextButton ? (
        <button className="font-core flex w-full items-center justify-between px-6 py-3 text-left text-stone-700 transition hover:bg-stone-100">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <Badge
          count={unreadCount}
          overflowCount={99}
          color="#F97316"
          offset={[-4, 4]}
        >
          <button className="text-red-500 hover:text-red-600 transform hover:scale-110 transition">
            <FaBell size={26} />
          </button>
        </Badge>
      )}
    </Popover>
  );
};

export default ClientNotification;
