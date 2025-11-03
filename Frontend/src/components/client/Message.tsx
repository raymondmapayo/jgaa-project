import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { RiMessage3Line } from "react-icons/ri";
import Swal from "sweetalert2";
import socket from "../../types/socket";

type Message = {
  message_id?: number;
  message: string;
  sender: string;
  timestamp: string;
};

const MessageClient = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [sentGreeting, setSentGreeting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const storedUserRole = sessionStorage.getItem("userRole");
    const storedUserId = sessionStorage.getItem("user_id");
    if (!storedUserRole || !storedUserId) return;

    setUserId(storedUserId);

    // Join socket room
    socket.emit(
      storedUserRole === "client" ? "joinClientRoom" : "joinWorkerRoom",
      storedUserId
    );

    const handleNewMessage = (data: any) => {
      if (data.receiver_id === storedUserId) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) =>
              m.message === data.message &&
              new Date(m.timestamp).getTime() ===
                new Date(data.timestamp).getTime()
          );
          if (exists) return prev;
          return [...prev, data];
        });
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    socket.on("newMessage", handleNewMessage);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/getClientMessages/${storedUserId}`
        );

        // ✅ Filter duplicate messages by text + timestamp
        const uniqueMessages = res.data.filter(
          (msg: Message, index: number, self: Message[]) =>
            index ===
            self.findIndex(
              (m) =>
                m.message === msg.message &&
                new Date(m.timestamp).getTime() ===
                  new Date(msg.timestamp).getTime()
            )
        );

        // ✅ Sort oldest → newest for better UI flow
        setMessages(uniqueMessages.reverse());
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

  // Greeting
  useEffect(() => {
    if (isOpen && !sentGreeting) {
      const greetingMessage: Message = {
        message: "Hello! How can I assist you today?",
        sender: "worker",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [greetingMessage, ...prev]);
      setSentGreeting(true);
    }
  }, [isOpen, sentGreeting]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      message: newMessage,
      sender_id: userId,
    };

    try {
      await axios.post(`${apiUrl}/sendMessageToAllWorkers`, messageData);

      const newMessageObj: Message = {
        message: newMessage,
        sender: "client",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessageObj]);
      setNewMessage("");

      socket.emit("newMessageToWorker", {
        ...newMessageObj,
        receiver_role: "worker",
      });

      Swal.fire({
        icon: "success",
        showConfirmButton: false,
        title: "Message Sent!",
        timer: 2000,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const toggleMessenger = () => setIsOpen(!isOpen);

  return (
    <div className="fixed z-50">
      <div
        onClick={toggleMessenger}
        className="fixed flex items-center justify-center bg-sky-600 text-white rounded-full h-16 w-16 shadow-lg border-4 right-4 bottom-4 cursor-pointer z-50 hover:bg-sky-700 transition-all"
      >
        <RiMessage3Line size={35} />
      </div>

      {isOpen && (
        <div className="fixed right-2 bottom-20 w-[90vw] sm:w-80 h-[70vh] sm:h-[400px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
          <div className="bg-sky-600 text-white p-4 font-semibold flex justify-between items-center">
            <span>Messenger</span>
            <button onClick={toggleMessenger} className="text-white">
              ✖
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-100">
            {messages.length > 0 ? (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === "worker" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[70%] ${
                      msg.sender === "client"
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">No messages</div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 bg-white border-t flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageClient;
