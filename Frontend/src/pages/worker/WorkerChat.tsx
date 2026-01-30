import { DefaultEventsMap } from "@socket.io/component-emitter";
import { Modal } from "antd";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import ChatWindow from "./Chat/ChatWindow";
import Sidebar from "./Chat/Sidebar";
import WorkerAnnouncementView from "./WorkerAnnouncement";
import { useLocation } from "react-router-dom";

export type Message = {
  id: number;
  message: string;
  sender: string; // "worker" or "admin"
  timestamp: string;
  senderId?: number;
  receiverId?: number;
};

export type Admin = {
  user_id: number;
  fname: string;
  lname: string;
  profile_pic: string;
  status: string;
  lastActive: string;
  last_message?: string;
  last_message_time?: string;
  last_sender_id?: number;
};

export type Client = {
  user_id: number;
  fname: string;
  lname: string;
  profile_pic: string;
  status: string;
  last_message?: string;
  last_message_time?: string;
  last_sender_id?: number;
};

export type Worker = {
  profile_pic: string;
};

export type User = Admin | Client;

interface WorkerChatProps {
  onNewMessage?: (message: Message) => void;
}

const WorkerChat: React.FC<WorkerChatProps> = ({ onNewMessage }) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const user_id = sessionStorage.getItem("user_id"); // current worker id
  const workerIdNum = user_id ? Number(user_id) : null;
  const apiUrl = import.meta.env.VITE_API_URL;
  const location = useLocation();

  const socket = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null
  );
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Connect socket and join worker room
  useEffect(() => {
    if (!workerIdNum) return;
    socket.current = io(`${apiUrl}`);
    socket.current.emit("joinWorkerRoom", workerIdNum);

    return () => {
      socket.current?.disconnect();
      socket.current = null;
    };
  }, [apiUrl, workerIdNum]);

  // Listen for new messages
  useEffect(() => {
    if (!socket.current) return;

    const handleIncomingMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      updateSidebarLastMessage(msg, msg.receiverId || 0, msg.senderId || 0);
    };

    socket.current.on("receive_message", handleIncomingMessage);

    return () => {
      socket.current?.off("receive_message", handleIncomingMessage);
    };
  }, []);

  // Fetch admins & clients
  useEffect(() => {
    if (!workerIdNum) return;
    const fetchData = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          axios.get(`${apiUrl}/get_admin_info/${workerIdNum}`),
          axios.get(`${apiUrl}/get_clients_info/${workerIdNum}`),
        ]);

        const adminsData = aRes.data.map((a: any) => ({
          ...a,
          last_sender_id:
            a.last_sender_id !== null ? Number(a.last_sender_id) : 0,
        }));

        const clientsData = cRes.data.map((c: any) => ({
          ...c,
          last_sender_id:
            c.last_sender_id !== null ? Number(c.last_sender_id) : 0,
        }));

        setAdmins(adminsData);
        setClients(clientsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [workerIdNum]);

  // Select user from notification (if any)
  useEffect(() => {
    const state: any = location.state;
    if (!state?.selectedUserId) return;
    if (admins.length + clients.length === 0) return;

    const user =
      clients.find((c) => c.user_id === state.selectedUserId) ||
      admins.find((a) => a.user_id === state.selectedUserId);

    if (user) setSelectedUser(user);
  }, [location, admins, clients]);

  // Default first user if none selected
  useEffect(() => {
    if (!selectedUser && admins.length + clients.length > 0) {
      setSelectedUser(admins[0] || clients[0]);
    }
  }, [admins, clients, selectedUser]);

  // Mark messages as read when selecting a user
  useEffect(() => {
    if (!selectedUser || !workerIdNum) return;

    const markAsRead = async () => {
      try {
        await axios.post(`${apiUrl}/markMessagesRead`, {
          sender_id: selectedUser.user_id,
          read_by: user_id,
        });

        setAdmins((prev) =>
          prev.map((u) =>
            u.user_id === selectedUser.user_id ? { ...u, unread_count: 0 } : u
          )
        );

        setClients((prev) =>
          prev.map((u) =>
            u.user_id === selectedUser.user_id ? { ...u, unread_count: 0 } : u
          )
        );
      } catch (err) {
        console.error("Failed to mark messages read", err);
      }
    };

    markAsRead();
  }, [selectedUser, workerIdNum]);

  // Fetch messages for selected user
  useEffect(() => {
    const fetchMessages = async () => {
      if (!workerIdNum || !selectedUser) return;

      try {
        const res = await axios.get(
          `${apiUrl}/getMessagesWorker/${workerIdNum}/${selectedUser.user_id}`
        );

        const msgs: Message[] = res.data
          .map((m: any) => ({
            id: m.id,
            message: m.message,
            sender: m.sender_id === workerIdNum ? "worker" : "admin",
            timestamp: m.timestamp,
            senderId: Number(m.sender_id),
            receiverId: Number(m.receiver_id),
          }))
          .reverse();

        setMessages(msgs);

        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          updateSidebarLastMessage(
            lastMsg,
            selectedUser.user_id,
            lastMsg.senderId!
          );
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    // 🔥 No setInterval needed, messages arrive via Socket.io
  }, [selectedUser, workerIdNum]);

  // Fetch worker profile
  useEffect(() => {
    if (workerIdNum) {
      axios
        .get(`${apiUrl}/get_worker_profile_pic/${workerIdNum}`)
        .then((res) => setSelectedWorker({ profile_pic: res.data.profile_pic }))
        .catch((err) => console.error(err));
    }
  }, [workerIdNum]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !workerIdNum) return;

    try {
      const endpoint =
        "lastActive" in selectedUser
          ? `${apiUrl}/sendMessageToAdmin`
          : `${apiUrl}/sendMessageToClients`;

      const res = await axios.post(endpoint, {
        message: newMessage,
        sender_id: workerIdNum,
        recipient_id: selectedUser.user_id,
      });

      const newMsg: Message & { receiverId: number } = {
        id: res.data.message_id,
        message: newMessage,
        sender: "worker",
        timestamp: new Date().toISOString(),
        senderId: workerIdNum,
        receiverId: selectedUser.user_id,
      };

      setMessages((prev) => [...prev, newMsg]);
      updateSidebarLastMessage(newMsg, selectedUser.user_id, workerIdNum);
      setNewMessage("");

      // Emit to Socket.io
      socket.current?.emit(
        "newMessageToWorker",
        newMsg // server will emit back to this worker's room
      );

      onNewMessage?.(newMsg);
    } catch (err) {
      console.error(err);
    }
  };

  // Update last message for sidebar
  const updateSidebarLastMessage = (
    msg: Message,
    userId: number,
    senderId: number
  ) => {
    setAdmins((prev) =>
      prev.map((u) =>
        u.user_id === userId
          ? {
              ...u,
              last_message: msg.message,
              last_message_time: msg.timestamp,
              last_sender_id: senderId,
            }
          : u
      )
    );
    setClients((prev) =>
      prev.map((u) =>
        u.user_id === userId
          ? {
              ...u,
              last_message: msg.message,
              last_message_time: msg.timestamp,
              last_sender_id: senderId,
            }
          : u
      )
    );
  };

  const formatTime = (t: string) =>
    new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    if (isMobile) setShowChat(true);
  };

  const handleBackToSidebar = () => setShowChat(false);
  const handleToggleAnnouncements = () => {
    if (isMobile) setModalVisible(true);
    else setShowAnnouncements((prev) => !prev);
  };

  return (
    <div className="flex flex-col md:flex-row h-[559px] w-full bg-gray-50 gap-0 md:gap-4">
      {/* Sidebar */}
      {(!isMobile || (isMobile && !showChat)) && (
        <div className="h-full flex-shrink-0 w-full md:w-auto">
          <Sidebar
            admins={admins}
            clients={clients}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            currentWorkerId={workerIdNum}
          />
        </div>
      )}

      {/* Chat Window */}
      {(!isMobile || (isMobile && showChat)) && (
        <div className="flex-1 h-full w-full md:w-auto">
          <ChatWindow
            messages={messages || []}
            newMessage={newMessage}
            selectedUser={selectedUser}
            selectedWorker={selectedWorker}
            chatEndRef={chatEndRef}
            onSendMessage={handleSendMessage}
            onMessageChange={setNewMessage}
            formatTime={formatTime}
            toggleAnnouncements={handleToggleAnnouncements}
            isMobile={isMobile}
            onBack={handleBackToSidebar}
          />
        </div>
      )}

      {/* Announcements Panel */}
      {showAnnouncements && !isMobile && (
        <div className="w-full md:w-1/3 h-full flex-shrink-0 bg-white shadow-md p-4 rounded-lg transition-all duration-300">
          <WorkerAnnouncementView />
        </div>
      )}

      {/* Mobile modal */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="90%"
        bodyStyle={{ padding: 0 }}
      >
        <WorkerAnnouncementView />
      </Modal>
    </div>
  );
};

export default WorkerChat;
