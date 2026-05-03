import { FaPaperPlane } from "react-icons/fa";
import { IoCall, IoEllipsisHorizontal, IoTrash } from "react-icons/io5";

type Message = {
  id: number;
  message: string;
  sender: string;
  timestamp: string;
};

type Worker = {
  user_id: number;
  fname: string;
  lname: string;
  profile_pic: string;
};

type Admin = {
  profile_pic: string;
};

type Props = {
  selectedUser: Worker | null;
  selectedAdmin: Admin | null;
  messages: Message[];
  newMessage: string;
  setNewMessage: (val: string) => void;
  handleSendMessage: () => void;
  formatTime: (timestamp: string) => string;
  chatEndRef: React.RefObject<HTMLDivElement>;
};

const Window = ({
  selectedUser,
  selectedAdmin,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  formatTime,
  chatEndRef,
}: Props) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        {selectedUser && (
          <>
            <div className="flex items-center">
              <img
                src={
                  selectedUser.profile_pic
                    ? `http://localhost:8081/uploads/images/${selectedUser.profile_pic}`
                    : "/fallback.jpg"
                }
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h2 className="text-lg font-bold">
                  {selectedUser.fname} {selectedUser.lname}
                </h2>
                <p className="text-sm text-gray-500">Last seen: 2 hours ago</p>
              </div>
            </div>

            <div className="flex gap-4 text-gray-500 text-xl">
              <IoCall />
              <IoTrash />
              <IoEllipsisHorizontal />
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end mb-4 ${
                msg.sender === "admin" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "admin" && selectedAdmin && (
                <img
                  src={
                    selectedAdmin.profile_pic
                      ? `http://localhost:8081/uploads/images/${selectedAdmin.profile_pic}`
                      : "/fallback.jpg"
                  }
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}

              {msg.sender === "worker" && selectedUser && (
                <img
                  src={
                    selectedUser.profile_pic
                      ? `http://localhost:8081/uploads/images/${selectedUser.profile_pic}`
                      : "/fallback.jpg"
                  }
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}

              <div
                className={`p-3 rounded-lg max-w-xs ${
                  msg.sender === "admin"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
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
          <div>No messages</div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t flex items-center">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={handleSendMessage}
          className="ml-3 bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default Window;
