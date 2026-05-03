import axios from "axios";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

import Sidebar from "./Chat/Sidebar";
import Window from "./Chat/Window";

// TYPES
type Worker = {
  user_id: number;
  fname: string;
  lname: string;
  profile_pic: string;
  status: string;
  lastActive: string;
  lastMessage: string;
};

type Message = {
  id: number;
  message: string;
  sender: string;
  timestamp: string;
};

type Admin = {
  profile_pic: string;
};

const AdminChat = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<Worker | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const socket = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  const adminId = sessionStorage.getItem("user_id");

  // ✅ SOCKET CONNECT
  useEffect(() => {
    if (!adminId) return;

    socket.current = io(apiUrl);
    socket.current.emit("joinAdminRoom", adminId);

    return () => {
      socket.current?.disconnect();
      socket.current = null;
    };
  }, [adminId]);

  // ✅ FETCH WORKERS + ADMIN PROFILE
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await axios.get(`${apiUrl}/get_workers_info/${adminId}`);
        setWorkers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchAdminProfile = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/get_admin_profile_pic/${adminId}`,
        );
        setSelectedAdmin(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (adminId) {
      fetchWorkers();
      fetchAdminProfile();
    }
  }, [adminId]);

  // ✅ FETCH MESSAGES
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/getMessagesForAdmin/${adminId}/${selectedUser.user_id}`,
        );
        setMessages(res.data.reverse());
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 1000);
    return () => clearInterval(interval);
  }, [selectedUser, adminId]);

  // ✅ SOCKET LISTENERS
  useEffect(() => {
    if (!socket.current) return;

    const workerHandler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    const adminHandler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.current.on("receiveMessageFromWorker", workerHandler);
    socket.current.on("receiveMessageFromAdmin", adminHandler);

    return () => {
      socket.current?.off("receiveMessageFromWorker", workerHandler);
      socket.current?.off("receiveMessageFromAdmin", adminHandler);
    };
  }, []);

  // ✅ SEND MESSAGE
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const res = await axios.post(`${apiUrl}/sendMessageToWorkers`, {
        message: newMessage,
        sender_id: adminId,
        recipient_id: selectedUser.user_id,
      });

      const newMsg: Message = {
        id: res.data.message_id,
        message: newMessage,
        sender: "admin",
        timestamp: new Date().toISOString(),
      };

      setNewMessage("");

      // ❗ DO NOT PUSH HERE (socket will handle it)
      // setMessages((prev) => [...prev, newMsg]);

      socket.current?.emit("newMessageFromAdmin", {
        ...newMsg,
        receiver_id: selectedUser.user_id,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ SELECT WORKER + MARK AS READ (FIXED)
  const handleSelectWorker = async (worker: Worker) => {
    setSelectedUser(worker);

    try {
      await axios.post(`${apiUrl}/markMessagesRead`, {
        sender_id: worker.user_id,
        read_by: adminId,
      });

      console.log("✅ Messages marked as read");
    } catch (err) {
      console.error("❌ Mark read failed:", err);
    }
  };

  // ✅ FORMAT TIME
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ AUTO SCROLL
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex gap-4 p-4 bg-gray-100 w-full overflow-hidden">
      <Sidebar
        workers={workers}
        selectedUser={selectedUser}
        onSelectWorker={handleSelectWorker}
      />

      <Window
        selectedUser={selectedUser}
        selectedAdmin={selectedAdmin}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        formatTime={formatTime}
        chatEndRef={chatEndRef}
      />
    </div>
  );
};

export default AdminChat;
