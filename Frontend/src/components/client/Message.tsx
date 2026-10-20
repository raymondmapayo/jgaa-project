import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowDownLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningFill,
  RiMessage3Fill,
  RiRefreshLine,
  RiSendPlane2Fill,
  RiTimeLine,
} from "react-icons/ri";
import socket from "../../types/socket";

type Message = {
  message_id?: number;
  message: string;
  sender: string; // "client" | "worker"
  sender_id?: string | number;
  timestamp: string;
  status?: "sending" | "sent" | "failed"; // local only
  localId?: string; // local only
};

const POLL_MS = 3000;
const QUICK_REPLIES = [
  "I need help with a booking",
  "I want to change my schedule",
  "I have a problem to report",
];

const GREETING: Message = {
  message: "Hi! 👋 How can we help you today?",
  sender: "worker",
  timestamp: "",
};

const toMs = (t: string) => new Date(t).getTime();
const formatTime = (t: string) =>
  new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const MessageClient = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [isOpen, setIsOpen] = useState(false);
  const [serverMessages, setServerMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<Message[]>([]); // optimistic / failed
  const [draft, setDraft] = useState("");
  const [userId, setUserId] = useState("");
  const [lastSeen, setLastSeen] = useState(() => Date.now());
  const [atBottom, setAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const isOpenRef = useRef(isOpen);
  const readUpToRef = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  /* ---------- helpers ---------- */

  const markRead = useCallback(
    async (uid: string, list: Message[]) => {
      // Only mark when the chat is open, and only messages we haven't marked yet
      const unread = list.filter(
        (m) => m.sender !== "client" && toMs(m.timestamp) > readUpToRef.current,
      );
      if (!unread.length) return;
      readUpToRef.current = Math.max(...unread.map((m) => toMs(m.timestamp)));

      const senders = [...new Set(unread.map((m) => m.sender_id))];
      await Promise.allSettled(
        senders.map((sid) =>
          axios.post(`${apiUrl}/markMessagesReadClient`, {
            sender_id: sid,
            receiver_id: uid,
            read_by: uid,
          }),
        ),
      );
    },
    [apiUrl],
  );

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  /* ---------- data: socket + polling ---------- */

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("user_id");
    if (!storedUserId) return;
    setUserId(storedUserId);

    socket.emit("joinClientRoom", storedUserId);

    const handleIncoming = (data: any) => {
      if (data.receiverId?.toString() !== storedUserId) return;
      setServerMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m.message === data.message &&
            toMs(m.timestamp) === toMs(data.timestamp),
        );
        return exists ? prev : [...prev, data];
      });
    };
    socket.on("send_message", handleIncoming);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/getClientMessages/${storedUserId}`,
        );
        const unique: Message[] = res.data.filter(
          (msg: Message, i: number, self: Message[]) =>
            i ===
            self.findIndex(
              (m) =>
                m.message === msg.message &&
                toMs(m.timestamp) === toMs(msg.timestamp),
            ),
        );
        const ordered = unique.reverse();

        // Skip re-render if nothing changed
        setServerMessages((prev) =>
          prev.length === ordered.length &&
          prev[prev.length - 1]?.timestamp ===
            ordered[ordered.length - 1]?.timestamp
            ? prev
            : ordered,
        );
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_MS);

    return () => {
      clearInterval(interval);
      socket.off("send_message", handleIncoming);
    };
  }, [apiUrl]);

  /* ---------- merged list ---------- */

  const messages = useMemo(() => {
    // Drop optimistic messages once the server list contains them
    const stillPending = pending.filter(
      (p) =>
        p.status === "failed" ||
        !serverMessages.some(
          (s) => s.sender === "client" && s.message === p.message,
        ),
    );
    return [...serverMessages, ...stillPending];
  }, [serverMessages, pending]);

  const hasUserMessage = messages.some((m) => m.sender === "client");
  const unreadCount = isOpen
    ? 0
    : serverMessages.filter(
        (m) => m.sender !== "client" && toMs(m.timestamp) > lastSeen,
      ).length;

  /* ---------- effects tied to open state ---------- */

  useEffect(() => {
    if (!isOpen) return;
    setLastSeen(Date.now());
    requestAnimationFrame(() => {
      scrollToBottom(false);
      inputRef.current?.focus();
    });
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen && userId) markRead(userId, serverMessages);
  }, [isOpen, userId, serverMessages, markRead]);

  useEffect(() => {
    if (isOpen && atBottom) scrollToBottom();
  }, [messages.length, isOpen, atBottom, scrollToBottom]);

  /* ---------- sending ---------- */

  const sendMessage = async (text: string, existingLocalId?: string) => {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;

    const localId = existingLocalId ?? crypto.randomUUID();
    const optimistic: Message = {
      message: trimmed,
      sender: "client",
      timestamp: new Date().toISOString(),
      status: "sending",
      localId,
    };

    setPending((prev) =>
      existingLocalId
        ? prev.map((p) =>
            p.localId === localId ? { ...p, status: "sending" } : p,
          )
        : [...prev, optimistic],
    );
    if (!existingLocalId) setDraft("");
    setAtBottom(true);

    try {
      await axios.post(`${apiUrl}/sendMessageToAllWorkers`, {
        message: trimmed,
        sender_id: userId,
      });

      setPending((prev) =>
        prev.map((p) => (p.localId === localId ? { ...p, status: "sent" } : p)),
      );

      socket.emit("newMessageToWorker", {
        message: trimmed,
        sender: "client",
        timestamp: optimistic.timestamp,
        receiver_role: "worker",
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setPending((prev) =>
        prev.map((p) =>
          p.localId === localId ? { ...p, status: "failed" } : p,
        ),
      );
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(draft);
    }
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  };

  const closeChat = () => {
    setLastSeen(Date.now());
    setIsOpen(false);
  };

  /* ---------- render ---------- */

  const display = [GREETING, ...messages];

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {/* Chat panel */}
      <section
        role="dialog"
        aria-label="Chat with support"
        aria-hidden={!isOpen}
        className={`absolute bottom-20 right-0 flex h-[min(34rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5 transition duration-200 ease-out motion-reduce:transition-none sm:w-96 ${
          isOpen
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        {/* Header */}
        <header className="flex items-center gap-3 bg-slate-900 px-4 py-3.5 text-white">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500">
              <RiMessage3Fill size={20} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold leading-tight">
              Support team
            </h2>
            <p className="text-xs text-slate-300">
              Online · usually replies in a few minutes
            </p>
          </div>
          <button
            onClick={closeChat}
            aria-label="Close chat"
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <RiCloseLine size={20} />
          </button>
        </header>

        {/* Messages */}
        <div className="relative flex-1 overflow-hidden bg-slate-50">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            role="log"
            aria-live="polite"
            className="h-full space-y-1 overflow-y-auto px-4 py-4"
          >
            {display.map((msg, i) => {
              const mine = msg.sender === "client";
              const next = display[i + 1];
              const endOfCluster =
                !next ||
                next.sender !== msg.sender ||
                (msg.timestamp &&
                  next.timestamp &&
                  toMs(next.timestamp) - toMs(msg.timestamp) > 5 * 60 * 1000);
              const prev = display[i - 1];
              const startOfCluster = !prev || prev.sender !== msg.sender;

              return (
                <div
                  key={msg.localId ?? msg.message_id ?? `${msg.timestamp}-${i}`}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"} ${
                    startOfCluster && i !== 0 ? "pt-2" : ""
                  }`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap break-words px-3.5 py-2 text-sm leading-relaxed ${
                      mine
                        ? `bg-sky-600 text-white ${
                            msg.status === "failed" ? "opacity-60" : ""
                          } rounded-2xl ${endOfCluster ? "rounded-br-md" : ""}`
                        : `bg-white text-slate-800 ring-1 ring-slate-200 rounded-2xl ${
                            endOfCluster ? "rounded-bl-md" : ""
                          }`
                    }`}
                  >
                    {msg.message}
                  </div>

                  {endOfCluster && (
                    <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-slate-400">
                      {msg.status === "sending" && (
                        <>
                          <RiTimeLine size={12} /> Sending…
                        </>
                      )}
                      {msg.status === "failed" && (
                        <button
                          onClick={() => sendMessage(msg.message, msg.localId)}
                          className="flex items-center gap-1 font-medium text-red-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        >
                          <RiErrorWarningFill size={12} />
                          Not sent. Retry
                          <RiRefreshLine size={12} />
                        </button>
                      )}
                      {msg.status !== "sending" &&
                        msg.status !== "failed" &&
                        msg.timestamp && (
                          <>
                            {formatTime(msg.timestamp)}
                            {mine && (
                              <RiCheckLine
                                size={13}
                                className="text-sky-500"
                                aria-label="Sent"
                              />
                            )}
                          </>
                        )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick replies: an easy way to start */}
            {!hasUserMessage && (
              <div className="flex flex-wrap gap-2 pt-3">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Jump to latest */}
          {!atBottom && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <RiArrowDownLine size={14} />
              Latest messages
            </button>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-end gap-2 rounded-2xl bg-slate-100 py-1.5 pl-3.5 pr-1.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Write a message"
              aria-label="Message"
              className="max-h-28 min-h-[2rem] flex-1 resize-none self-center bg-transparent py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => sendMessage(draft)}
              disabled={!draft.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <RiSendPlane2Fill size={18} />
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-slate-400">
            Enter to send · Shift + Enter for a new line
          </p>
        </div>
      </section>

      {/* Launcher */}
      <button
        onClick={() => (isOpen ? closeChat() : setIsOpen(true))}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl shadow-sky-600/30 transition hover:scale-105 hover:bg-sky-700 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
      >
        {isOpen ? <RiCloseLine size={30} /> : <RiMessage3Fill size={30} />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default MessageClient;
