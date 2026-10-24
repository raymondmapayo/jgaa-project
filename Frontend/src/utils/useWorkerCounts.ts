/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

// Any page can call refreshWorkerCounts() to update the sidebar badges right away
const REFRESH_EVENT = "worker:refresh-counts";
export const refreshWorkerCounts = () =>
  window.dispatchEvent(new Event(REFRESH_EVENT));

export interface WorkerCounts {
  orders: number; // orders that are still "pending"
  reservation: number; // reservations that are still "Reserved"
  chats: number; // unread chat messages + unread announcements
}

const POLL_MS = 30000; // checks for new items every 30 seconds

// Counts unread chat messages from the admin and client lists
const sumUnread = (list: any) =>
  Array.from(
    new Map(
      (Array.isArray(list) ? list : []).map((u: any) => [u.user_id, u]),
    ).values(),
  ).reduce((sum: number, u: any) => sum + (Number(u.unread_count) || 0), 0);

/**
 * Counts the items that still need attention:
 * - orders with payment_status "pending"
 * - reservations with table_status "Reserved"
 * - unread chat messages plus unread announcements
 * Once something is handled or read, it drops out of the count,
 * and the badge disappears at 0.
 *
 * `refreshKey` (for example the current route) triggers a refresh when it changes.
 */
export const useWorkerCounts = (refreshKey?: string): WorkerCounts => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [counts, setCounts] = useState<WorkerCounts>({
    orders: 0,
    reservation: 0,
    chats: 0,
  });

  const load = useCallback(async () => {
    const workerId = sessionStorage.getItem("user_id");

    const [
      ordersRes,
      reservationsRes,
      adminsRes,
      clientsRes,
      announcementsRes,
    ] = await Promise.allSettled([
      axios.get(`${apiUrl}/fetch_orders`),
      axios.get(`${apiUrl}/get_reservation`),
      workerId
        ? axios.get(`${apiUrl}/get_admin_info/${workerId}`)
        : Promise.reject(new Error("no worker")),
      workerId
        ? axios.get(`${apiUrl}/get_clients_info/${workerId}`)
        : Promise.reject(new Error("no worker")),
      workerId
        ? axios.get(`${apiUrl}/get_announcements_for_worker/${workerId}`)
        : Promise.reject(new Error("no worker")),
    ]);

    // If a request fails, keep the previous number instead of resetting it
    setCounts((prev) => {
      const chatsReady =
        adminsRes.status === "fulfilled" &&
        clientsRes.status === "fulfilled" &&
        announcementsRes.status === "fulfilled";

      return {
        orders:
          ordersRes.status === "fulfilled"
            ? (ordersRes.value.data?.orders ?? []).filter(
                (o: any) =>
                  String(o.payment_status).toLowerCase() === "pending",
              ).length
            : prev.orders,
        reservation:
          reservationsRes.status === "fulfilled"
            ? (Array.isArray(reservationsRes.value.data)
                ? reservationsRes.value.data
                : []
              ).filter(
                (r: any) => String(r.table_status).toLowerCase() === "reserved",
              ).length
            : prev.reservation,
        chats: chatsReady
          ? sumUnread(adminsRes.value.data) +
            sumUnread(clientsRes.value.data) +
            (Array.isArray(announcementsRes.value.data)
              ? announcementsRes.value.data
              : []
            ).filter((a: any) => String(a.status).toLowerCase() !== "read")
              .length
          : prev.chats,
      };
    });
  }, [apiUrl]);

  // Load on mount and whenever the route changes
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Keep it fresh: poll, refresh on tab focus, and refresh when a page asks
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener(REFRESH_EVENT, onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(REFRESH_EVENT, onFocus);
    };
  }, [load]);

  // Real time: a new chat message updates the badge right away
  useEffect(() => {
    const workerId = sessionStorage.getItem("user_id");
    if (!workerId) return;

    const socket = io(`${apiUrl}`);
    socket.emit("joinWorkerRoom", Number(workerId));

    let timer: ReturnType<typeof setTimeout>;
    const onMessage = () => {
      // short delay so the chat page can mark it read first when it is open
      clearTimeout(timer);
      timer = setTimeout(load, 1200);
    };
    socket.on("receive_message", onMessage);

    return () => {
      clearTimeout(timer);
      socket.off("receive_message", onMessage);
      socket.disconnect();
    };
  }, [apiUrl, load]);

  return counts;
};
