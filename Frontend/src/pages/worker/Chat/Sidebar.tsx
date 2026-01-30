import { useEffect, useReducer, useState } from "react";
import { FaSearch } from "react-icons/fa";

// ⬇️⬇️⬇️ ADDED THIS HELPER (prevents duplicates) ⬇️⬇️⬇️
const dedupeUsers = (list: any[]) => {
  // <-- ADDED
  const map = new Map();
  list.forEach((u) => map.set(u.user_id, u));
  return Array.from(map.values());
}; // <-- ADDED

type SidebarProps = {
  admins: any[];
  clients: any[];
  selectedUser: any;
  onSelectUser: (user: any) => void;
  currentWorkerId: number | null;
};

const apiUrl = import.meta.env.VITE_API_URL;

const Sidebar = ({
  admins,
  clients,
  selectedUser,
  onSelectUser,
  currentWorkerId,
}: SidebarProps) => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0); // force re-render

  const [users, setUsers] = useState<any[]>([]); // <-- CHANGED (initial empty array)

  // Update users when admins or clients change
  useEffect(() => {
    setUsers(dedupeUsers([...admins, ...clients])); // <-- CHANGED (dedupe applied)
  }, [admins, clients]); // keep the deps the same

  // Force re-render every 10 seconds to update active status dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 10000); // every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const diff = new Date().getTime() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${days}d`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-white border-r shadow-md md:rounded-lg">
      <div className="bg-white z-10 p-4 border-b md:rounded-t-lg">
        <h2 className="text-lg font-bold mb-4">Workers</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 rounded-lg border bg-gray-100 focus:outline-none"
          />
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {users.map((user) => {
          const preview = user.last_message
            ? (Number(user.last_sender_id) === currentWorkerId ? "You: " : "") +
              (user.last_message.length > 20
                ? user.last_message.slice(0, 20) + "..."
                : user.last_message)
            : "";

          // Active if user_login_time exists and not too old
          const isActive =
            user.user_login_time &&
            new Date().getTime() - new Date(user.user_login_time).getTime() <
              30 * 60 * 1000; // 30 min

          return (
            <div
              key={user.user_id}
              className={`flex items-center p-2 cursor-pointer rounded-lg hover:bg-gray-200 ${
                selectedUser?.user_id === user.user_id
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              onClick={() => onSelectUser(user)} // ✅ HERE (correct)
            >
              <div className="relative w-10 h-10 mr-3 flex-shrink-0">
                <img
                  src={
                    user.profile_pic?.startsWith("http")
                      ? user.profile_pic
                      : user.profile_pic
                      ? `${apiUrl}/uploads/images/${user.profile_pic}`
                      : "/avatar.jpg"
                  }
                  alt={`${user.fname} ${user.lname}`}
                  className="w-full h-full rounded-full object-cover"
                />

                {/* Status Indicator */}
                <div
                  className={`absolute flex items-center justify-center text-[8px] font-bold bottom-0 right-0 border-2 border-white ${
                    isActive
                      ? "bg-green-500 w-3 h-3 rounded-full text-white"
                      : "bg-[#f6ffed] w-auto px-1 rounded-full text-black"
                  }`}
                  title={
                    isActive
                      ? "Online"
                      : user.last_active_time
                      ? `Last active: ${formatTime(user.last_active_time)} ago`
                      : "No activity"
                  }
                >
                  {!isActive && user.last_active_time
                    ? formatTime(user.last_active_time)
                    : ""}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {user.fname} {user.lname}
                </h3>
                <p className="text-sm text-gray-500 truncate">{preview}</p>
              </div>

              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                {isActive
                  ? "Online"
                  : user.last_active_time
                  ? formatTime(user.last_active_time)
                  : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
