import { Tooltip } from "antd";
import { Fragment, useEffect } from "react";
import {
  RiArrowLeftLine,
  RiMegaphoneLine,
  RiMessage3Line,
  RiSendPlane2Fill,
} from "react-icons/ri";
import { getAvatarUrl, isOnline, timeAgo } from "../../../utils/Chatutils";

type ChatWindowProps = {
  messages: any[];
  newMessage: string;
  selectedUser: any;
  selectedWorker: any;
  chatEndRef: React.RefObject<HTMLDivElement>;
  onSendMessage: () => void;
  onMessageChange: (val: string) => void;
  formatTime: (t: string) => string;
  toggleAnnouncements: () => void;
  isMobile?: boolean;
  onBack?: () => void;
};

const ms = (t: string) => new Date(t).getTime();
const dayKey = (t: string) => new Date(t).toDateString();

const dayLabel = (t: string) => {
  const d = new Date(t);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const ChatWindow = ({
  messages,
  newMessage,
  selectedUser,
  chatEndRef,
  onSendMessage,
  onMessageChange,
  formatTime,
  toggleAnnouncements,
  isMobile = false,
  onBack,
}: ChatWindowProps) => {
  // Always show the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, selectedUser?.user_id, chatEndRef]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-white text-center ring-1 ring-slate-200 md:rounded-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600">
          <RiMessage3Line size={28} />
        </div>
        <p className="font-medium text-slate-800">Select a conversation</p>
        <p className="text-sm text-slate-500">
          Pick someone from the list to start chatting.
        </p>
      </div>
    );
  }

  const online = isOnline(selectedUser);
  const status = online
    ? "Active now"
    : selectedUser.last_active_time
      ? `Active ${timeAgo(selectedUser.last_active_time)} ago`
      : "No recent activity";

  return (
    <section className="flex h-full flex-col overflow-hidden bg-white ring-1 ring-slate-200 md:rounded-2xl">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        {isMobile && onBack && (
          <button
            onClick={onBack}
            aria-label="Back to conversations"
            className="-ml-1 rounded-full p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <RiArrowLeftLine size={20} />
          </button>
        )}

        <div className="relative h-10 w-10 shrink-0">
          <img
            src={getAvatarUrl(selectedUser.profile_pic)}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
              online ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {selectedUser.fname} {selectedUser.lname}
          </h2>
          <p className="text-xs text-slate-500">{status}</p>
        </div>

        <Tooltip title="Announcements" placement="bottom">
          <button
            onClick={toggleAnnouncements}
            aria-label="View announcements"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <RiMegaphoneLine size={20} />
          </button>
        </Tooltip>
      </header>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-slate-50 px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-medium text-slate-700">No messages yet</p>
            <p className="text-sm text-slate-500">
              Say hello to {selectedUser.fname}.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const mine = msg.sender === "worker";

          const newDay =
            !prev || dayKey(prev.timestamp) !== dayKey(msg.timestamp);
          const start = newDay || prev.sender !== msg.sender;
          const end =
            !next ||
            next.sender !== msg.sender ||
            dayKey(next.timestamp) !== dayKey(msg.timestamp) ||
            ms(next.timestamp) - ms(msg.timestamp) > 5 * 60 * 1000;

          return (
            <Fragment key={msg.id}>
              {newDay && (
                <div className="flex justify-center py-3">
                  <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-medium text-slate-600">
                    {dayLabel(msg.timestamp)}
                  </span>
                </div>
              )}

              <div
                className={`flex items-end gap-2 ${
                  mine ? "justify-end" : "justify-start"
                } ${start && !newDay ? "pt-2" : ""}`}
              >
                {!mine && (
                  <div className="h-7 w-7 shrink-0">
                    {end && (
                      <img
                        src={getAvatarUrl(selectedUser.profile_pic)}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    )}
                  </div>
                )}

                <div
                  className={`flex max-w-[75%] flex-col ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mine
                        ? `bg-sky-600 text-white ${end ? "rounded-br-md" : ""}`
                        : `bg-white text-slate-800 ring-1 ring-slate-200 ${
                            end ? "rounded-bl-md" : ""
                          }`
                    }`}
                  >
                    {msg.message}
                  </div>
                  {end && (
                    <span className="mt-1 px-1 text-[11px] text-slate-400">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </Fragment>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2 rounded-2xl bg-slate-100 py-1.5 pl-4 pr-1.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500">
          <textarea
            rows={1}
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Message ${selectedUser.fname}`}
            aria-label="Message"
            className="max-h-32 min-h-[2rem] flex-1 resize-none self-center bg-transparent py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <RiSendPlane2Fill size={18} />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-slate-400">
          Enter to send. Shift + Enter for a new line.
        </p>
      </div>
    </section>
  );
};

export default ChatWindow;
