// ChatWindow.tsx
import { Button, Tooltip } from "antd";

import { FaPaperPlane } from "react-icons/fa";
import { IoEllipsisHorizontal } from "react-icons/io5";

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
const apiUrl = import.meta.env.VITE_API_URL;

const ChatWindow = ({
  messages,
  newMessage,
  selectedUser,
  selectedWorker,
  chatEndRef,
  onSendMessage,
  onMessageChange,
  formatTime,
  toggleAnnouncements,
  isMobile = false,
  onBack,
}: ChatWindowProps) => {
  const formatRelativeTime = (timestamp: string) => {
    if (!timestamp) return "";

    const diff = new Date().getTime() - new Date(timestamp).getTime();

    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-white border-l shadow-md rounded-lg">
      {/* Header */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1 bg-gray-200 rounded-lg text-sm"
            >
              Back
            </button>
          )}
          {selectedUser && (
            <>
              <img
                src={
                  selectedUser.profile_pic?.startsWith("http")
                    ? selectedUser.profile_pic
                    : selectedUser.profile_pic
                    ? `${apiUrl}/uploads/images/${selectedUser.profile_pic}`
                    : "/avatar.jpg"
                }
                className="w-10 h-10 rounded-full"
              />

              <div className="flex flex-col">
                <h2 className="text-lg font-bold truncate sm:truncate md:overflow-visible max-w-[120px] md:max-w-full">
                  {selectedUser.fname} {selectedUser.lname}
                </h2>
                <span className="text-sm text-gray-400">
                  {selectedUser.user_login_time
                    ? "Active" // user is currently logged in
                    : selectedUser.last_active_time
                    ? `Active ${formatRelativeTime(
                        selectedUser.last_active_time
                      )}`
                    : "No activity"}
                </span>
              </div>
            </>
          )}
        </div>
        {selectedUser && (
          <div className="flex gap-4 text-gray-500 text-xl">
            <Tooltip title="View Announcements" placement="bottom">
              <IoEllipsisHorizontal
                className="cursor-pointer"
                onClick={toggleAnnouncements}
              />
            </Tooltip>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 h-[448px]">
        {messages?.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end mb-4 ${
                msg.sender === "worker" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "worker" && selectedWorker && (
                <img
                  src={
                    selectedWorker.profile_pic?.startsWith("http")
                      ? selectedWorker.profile_pic
                      : selectedWorker.profile_pic
                      ? `${apiUrl}/uploads/images/${selectedWorker.profile_pic}`
                      : "/avatar.jpg"
                  }
                  alt="worker-avatar"
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              {msg.sender !== "worker" && selectedUser && (
                <img
                  src={
                    selectedUser.profile_pic?.startsWith("http")
                      ? selectedUser.profile_pic
                      : selectedUser.profile_pic
                      ? `${apiUrl}/uploads/images/${selectedUser.profile_pic}`
                      : "/avatar.jpg"
                  }
                  alt="user-avatar"
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              <div
                className={`p-3 rounded-lg max-w-xs break-words ${
                  msg.sender === "worker"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.message}
              </div>
              <p className="text-xs text-gray-400 ml-2">
                {formatTime(msg.timestamp)}
              </p>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center text-gray-400 h-full">
            No messages
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t flex items-center">
        <input
          type="text"
          placeholder="Type something here..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
        />
        <Button
          type="primary"
          shape="circle"
          onClick={onSendMessage}
          className="ml-3 flex items-center justify-center bg-green-500 hover:bg-green-600 border-none"
          icon={<FaPaperPlane />}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
