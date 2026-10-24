import { DefaultEventsMap } from "@socket.io/component-emitter";
import { Modal } from "antd";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import ChatWindow from "./Chat/ChatWindow";
import Sidebar from "./Chat/Sidebar";
import WorkerAnnouncementView from "./WorkerAnnouncement";
import { refreshWorkerCounts } from "../../utils/useWorkerCounts";

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
  unread_count?: number;
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
  unread_count?: number;
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
    null,
  );
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // Lets the socket listener see the open conversation without re-subscribing
  const selectedUserRef = useRef<User | null>(null);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Connect socket, join worker room, listen for new messages
  useEffect(() => {
    if (!workerIdNum) return;
    const s = io(`${apiUrl}`);
    socket.current = s;
    s.emit("joinWorkerRoom", workerIdNum);

    const handleIncomingMessage = (raw: Message) => {
      const msg: Message = {
        ...raw,
        sender: Number(raw.senderId) === workerIdNum ? "worker" : "admin",
      };
      const otherId =
        Number(msg.senderId) === workerIdNum
          ? Number(msg.receiverId)
          : Number(msg.senderId);
      const isOpenChat = selectedUserRef.current?.user_id === otherId;

      // Only show it if it belongs to the conversation that's open, and skip echoes
      if (isOpenChat) {
        setMessages((prev) =>
          prev.some(
            (m) =>
              (msg.id != null && m.id === msg.id) ||
              (m.message === msg.message && m.timestamp === msg.timestamp),
          )
            ? prev
            : [...prev, msg],
        );
        if (msg.sender !== "worker") {
          axios
            .post(`${apiUrl}/markMessagesRead`, {
              sender_id: otherId,
              read_by: user_id,
            })
            .catch(() => {});
        }
      }

      updateSidebarLastMessage(msg, otherId, Number(msg.senderId), {
        unread: msg.sender !== "worker" && !isOpenChat,
      });
    };

    s.on("receive_message", handleIncomingMessage);

    return () => {
      s.off("receive_message", handleIncomingMessage);
      s.disconnect();
      socket.current = null;
    };
  }, [apiUrl, workerIdNum]);

  // Fetch admins & clients
  useEffect(() => {
    if (!workerIdNum) return;
    const fetchData = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          axios.get(`${apiUrl}/get_admin_info/${workerIdNum}`),
          axios.get(`${apiUrl}/get_clients_info/${workerIdNum}`),
        ]);

        setAdmins(
          aRes.data.map((a: any) => ({
            ...a,
            last_sender_id:
              a.last_sender_id !== null ? Number(a.last_sender_id) : 0,
          })),
        );
        setClients(
          cRes.data.map((c: any) => ({
            ...c,
            last_sender_id:
              c.last_sender_id !== null ? Number(c.last_sender_id) : 0,
          })),
        );
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
  // Mark messages as read when selecting a user
  useEffect(() => {
    if (!selectedUser || !workerIdNum) return;

    let cancelled = false;

    const markAsRead = async () => {
      try {
        await axios.post(`${apiUrl}/markMessagesRead`, {
          sender_id: selectedUser.user_id,
          read_by: user_id,
        });

        if (cancelled) return;

        // Dayon i-zero ang unread count sa selected conversation
        const clear = <T extends User>(list: T[]) =>
          list.map((u) =>
            Number(u.user_id) === Number(selectedUser.user_id)
              ? { ...u, unread_count: 0 }
              : u,
          );

        setAdmins((prev) => clear(prev));
        setClients((prev) => clear(prev));

        // Dayon i-refresh ang count sa main Worker Sidebar
        refreshWorkerCounts();
      } catch (err) {
        console.error("Failed to mark messages read", err);
      }
    };

    markAsRead();

    return () => {
      cancelled = true;
    };
  }, [selectedUser?.user_id, workerIdNum, apiUrl, user_id]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!workerIdNum || !selectedUser) return;
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/getMessagesWorker/${workerIdNum}/${selectedUser.user_id}`,
        );
        if (cancelled) return; // user switched conversations mid-request

        const msgs: Message[] = res.data.map((m: any) => ({
          id: m.id,
          message: m.message,
          sender: m.sender_id === workerIdNum ? "worker" : "admin",
          timestamp: m.timestamp,
          senderId: Number(m.sender_id),
          receiverId: Number(m.receiver_id),
        }));

        setMessages(msgs);

        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          updateSidebarLastMessage(
            lastMsg,
            selectedUser.user_id,
            lastMsg.senderId!,
          );
        }
      } catch (err) {
        console.error(err);
      }
    };

    setMessages([]);
    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedUser?.user_id, workerIdNum]);

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
    const text = newMessage.trim();
    if (!text || !selectedUser || !workerIdNum) return;

    try {
      const endpoint =
        "lastActive" in selectedUser
          ? `${apiUrl}/sendMessageToAdmin`
          : `${apiUrl}/sendMessageToClients`;

      const res = await axios.post(endpoint, {
        message: text,
        sender_id: workerIdNum,
        recipient_id: selectedUser.user_id,
      });

      const newMsg: Message & { receiverId: number } = {
        id: res.data.message_id,
        message: text,
        sender: "worker",
        timestamp: new Date().toISOString(),
        senderId: workerIdNum,
        receiverId: selectedUser.user_id,
      };

      setMessages((prev) => [...prev, newMsg]);
      updateSidebarLastMessage(newMsg, selectedUser.user_id, workerIdNum);
      setNewMessage("");

      socket.current?.emit("newMessageToWorker", newMsg);
      onNewMessage?.(newMsg);
    } catch (err) {
      console.error(err);
    }
  };

  // Update last message (and optionally unread count) for sidebar
  const updateSidebarLastMessage = (
    msg: Message,
    userId: number,
    senderId: number,
    opts?: { unread?: boolean },
  ) => {
    const apply = <T extends User>(list: T[]) =>
      list.map((u) =>
        u.user_id === userId
          ? {
              ...u,
              last_message: msg.message,
              last_message_time: msg.timestamp,
              last_sender_id: senderId,
              unread_count: opts?.unread
                ? (u.unread_count || 0) + 1
                : u.unread_count,
            }
          : u,
      );
    setAdmins((prev) => apply(prev));
    setClients((prev) => apply(prev));
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
    <div className="h-[559px] w-full">
      <div className="flex h-full w-full flex-col gap-3 md:flex-row">
        {/* Sidebar */}
        {(!isMobile || !showChat) && (
          <div className="h-full w-full flex-shrink-0 md:w-[300px]">
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
        {(!isMobile || showChat) && (
          <div className="h-full min-w-0 flex-1">
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
          <div className="h-full min-w-0 flex-1">
            <WorkerAnnouncementView />
          </div>
        )}

        {/* Mobile modal */}
        <Modal
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width="90%"
          styles={{ body: { padding: 0 } }}
        >
          <WorkerAnnouncementView />
        </Modal>
      </div>
    </div>
  );
};

export default WorkerChat;
