import { useEffect, useMemo, useState } from "react";
import { RiSearchLine } from "react-icons/ri";
import { getAvatarUrl, isOnline, timeAgo } from "../../../utils/Chatutils";

const dedupeUsers = (list: any[]) =>
  Array.from(new Map(list.map((u) => [u.user_id, u])).values());

type SidebarProps = {
  admins: any[];
  clients: any[];
  selectedUser: any;
  onSelectUser: (user: any) => void;
  currentWorkerId: number | null;
};

const Sidebar = ({
  admins,
  clients,
  selectedUser,
  onSelectUser,
  currentWorkerId,
}: SidebarProps) => {
  const [query, setQuery] = useState("");
  const [, setTick] = useState(0);

  // Keep relative times fresh
  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    const id = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const filter = (list: any[]) => {
    const q = query.trim().toLowerCase();
    const unique = dedupeUsers(list);
    if (!q) return unique;
    return unique.filter((u) =>
      `${u.fname} ${u.lname}`.toLowerCase().includes(q),
    );
  };

  const groups = useMemo(
    () => [
      { label: "Admins", users: filter(admins) },
      { label: "Clients", users: filter(clients) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admins, clients, query],
  );

  const total = groups.reduce((n, g) => n + g.users.length, 0);

  const renderUser = (user: any) => {
    const selected = selectedUser?.user_id === user.user_id;
    const online = isOnline(user);
    const unread = Number(user.unread_count) || 0;
    const mine = Number(user.last_sender_id) === currentWorkerId;

    return (
      <li key={user.user_id}>
        <button
          onClick={() => onSelectUser(user)}
          aria-current={selected ? "true" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            selected ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-slate-100"
          }`}
        >
          <div className="relative h-11 w-11 shrink-0">
            <img
              src={getAvatarUrl(user.profile_pic)}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
            <span
              title={online ? "Online" : "Offline"}
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                online ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3
                className={`truncate text-sm ${
                  unread
                    ? "font-semibold text-slate-900"
                    : "font-medium text-slate-800"
                }`}
              >
                {user.fname} {user.lname}
              </h3>
              <span className="shrink-0 text-[11px] text-slate-400">
                {timeAgo(user.last_message_time)}
              </span>
            </div>

            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p
                className={`truncate text-xs ${
                  unread ? "font-medium text-slate-700" : "text-slate-500"
                }`}
              >
                {user.last_message
                  ? `${mine ? "You: " : ""}${user.last_message}`
                  : "No messages yet"}
              </p>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[11px] font-medium text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
          </div>
        </button>
      </li>
    );
  };

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-white ring-1 ring-slate-200 md:rounded-2xl">
      <div className="space-y-3 border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
        <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500">
          <RiSearchLine className="text-slate-400" size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            aria-label="Search conversations"
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {total === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {query ? `No one matches "${query}".` : "No conversations yet."}
          </p>
        ) : (
          groups
            .filter((g) => g.users.length > 0)
            .map((g) => (
              <section key={g.label} className="mb-2">
                <h3 className="px-3 pb-1 pt-2 text-xs font-medium text-slate-500">
                  {g.label}
                </h3>
                <ul className="space-y-0.5">{g.users.map(renderUser)}</ul>
              </section>
            ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
