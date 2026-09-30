import { Checkbox, Empty, notification } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

type Announcement = {
  title: string;
  message: string;
  created_at: string;
  status: string; // 'unread' or 'read'
  recipient_id: string;
  announcement_id: string; // Unique ID for the announcement
};

const apiUrl = import.meta.env.VITE_API_URL;

const WorkerAnnouncement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(
    new Set(),
  );

  const workerId = sessionStorage.getItem("user_id");

  const fetchAnnouncements = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);

      if (!workerId) {
        console.error("Worker ID not found in session storage");
        return;
      }

      const response = await axios.get(
        `${apiUrl}/get_announcements_for_worker/${workerId}`,
      );

      setAnnouncements(response.data);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);

      notification.error({
        message: "Error",
        description: "Failed to load announcements.",
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    // Fetch balik kung mubalik sa browser tab
    const onFocus = () => fetchAnnouncements(false);

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [workerId, apiUrl]);

  const toggleRead = async (announcement_id: string) => {
    if (!workerId) {
      console.error("Worker ID not found in session storage");
      return;
    }

    setReadAnnouncements((prev) => {
      const updated = new Set(prev);
      if (updated.has(announcement_id)) {
        updated.delete(announcement_id);
      } else {
        updated.add(announcement_id);
      }
      return updated;
    });

    try {
      const response = await fetch(`${apiUrl}/update_announcement_status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          announcement_id,
          recipient_id: workerId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        notification.success({
          message: "Announcement marked as read",
          description: "The announcement status was updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      notification.error({
        message: "Error",
        description: "Failed to update announcement status.",
      });
    }
  };

  const allRead =
    announcements.length > 0 &&
    announcements.every((a) => readAnnouncements.has(a.announcement_id));

  const someRead =
    announcements.some((a) => readAnnouncements.has(a.announcement_id)) &&
    !allRead;

  const onSelectAllChange = async (checked: boolean) => {
    if (checked) {
      setReadAnnouncements(
        new Set(announcements.map((a) => a.announcement_id)),
      );

      if (!workerId) {
        console.error("Worker ID not found in session storage");
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl}/update_all_announcements_status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ worker_id: workerId, status: "read" }),
          },
        );

        const data = await response.json();

        if (data.success) {
          notification.success({
            message: "All announcements marked as read",
            description: "All announcements have been successfully updated.",
          });
        }
      } catch (error) {
        console.error("Error updating all announcements status:", error);
        notification.error({
          message: "Error",
          description: "Failed to update all announcements status.",
        });
      }
    } else {
      setReadAnnouncements(new Set());
    }
  };

  const formatDate = (date: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    };

    return new Date(date).toLocaleString("en-GB", options);
  };

  // ─────────────────────────────────────────────────────────────
  // Display-only values for the UI
  // ─────────────────────────────────────────────────────────────
  const isItemRead = (a: Announcement) =>
    readAnnouncements.has(a.announcement_id) || a.status === "read";

  const unreadCount = announcements.filter((a) => !isItemRead(a)).length;

  const readPercent =
    announcements.length === 0
      ? 0
      : Math.round(
          ((announcements.length - unreadCount) / announcements.length) * 100,
        );

  return (
    <div className="w-full h-full bg-white">
      <section
        className="flex w-full h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
        aria-label="Announcements"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-lamaPurpleLight text-xl"
                aria-hidden="true"
              >
                📢
              </span>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold leading-tight text-gray-900">
                  Announcements
                </h2>

                <p className="text-sm text-gray-500">
                  {isLoading
                    ? "Checking for new announcements…"
                    : announcements.length === 0
                      ? "You're all caught up"
                      : unreadCount === 0
                        ? "You've read everything"
                        : `${unreadCount} unread of ${announcements.length}`}
                </p>
              </div>
            </div>

            {!isLoading && unreadCount > 0 && (
              <span className="flex-shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Read progress + mark all */}
          {!isLoading && announcements.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-gray-200"
                  role="progressbar"
                  aria-valuenow={readPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Announcements read"
                >
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${readPercent}%` }}
                  />
                </div>

                <span className="whitespace-nowrap text-xs text-gray-500">
                  {readPercent}% read
                </span>
              </div>

              <Checkbox
                indeterminate={someRead}
                checked={allRead}
                onChange={(e) => onSelectAllChange(e.target.checked)}
              >
                Mark all as read
              </Checkbox>
            </div>
          )}
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ul className="divide-y divide-gray-100" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="animate-pulse px-5 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-100" />
                  </div>

                  <div className="mt-3 h-3 w-full rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
                </li>
              ))}
            </ul>
          ) : announcements.length === 0 ? (
            <div className="flex h-full min-h-[300px] items-center justify-center px-5 py-10">
              <Empty description="No announcements yet. New ones will show up here." />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {announcements.map(
                ({ announcement_id, title, message, created_at, status }) => {
                  const isRead =
                    readAnnouncements.has(announcement_id) || status === "read";

                  return (
                    <li
                      key={announcement_id}
                      className={`relative px-5 py-5 transition-colors duration-200 ${
                        isRead
                          ? "bg-white"
                          : "bg-lamaPurpleLight hover:bg-lamaPurpleLight/80"
                      }`}
                    >
                      {/* Unread rail */}
                      {!isRead && (
                        <span
                          className="absolute inset-y-0 left-0 w-1 bg-indigo-500"
                          aria-hidden="true"
                        />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Status dot */}
                        <span
                          className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                            isRead ? "bg-gray-300" : "bg-indigo-500"
                          }`}
                          aria-label={isRead ? "Read" : "Unread"}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                            <h3
                              className={`text-base leading-snug ${
                                isRead
                                  ? "font-medium text-gray-500"
                                  : "font-semibold text-gray-900"
                              }`}
                            >
                              {title}
                            </h3>

                            <time
                              className="whitespace-nowrap text-xs text-gray-500"
                              dateTime={created_at || undefined}
                            >
                              {created_at ? formatDate(created_at) : "No date"}
                            </time>
                          </div>

                          <p
                            className={`mt-2 max-w-prose whitespace-pre-line break-words text-sm leading-relaxed ${
                              isRead ? "text-gray-500" : "text-gray-700"
                            }`}
                          >
                            {message}
                          </p>

                          <div className="mt-4">
                            <Checkbox
                              checked={isRead}
                              onChange={() => toggleRead(announcement_id)}
                            >
                              <span className="text-sm text-gray-600">
                                {isRead ? "Read" : "Mark as read"}
                              </span>
                            </Checkbox>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                },
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default WorkerAnnouncement;
