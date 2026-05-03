import { useState } from "react";
import { FaSearch } from "react-icons/fa";

type Worker = {
  user_id: number;
  fname: string;
  lname: string;
  profile_pic: string;
  status: string;
  lastActive: string;
  lastMessage: string;
};

type Props = {
  workers: Worker[];
  selectedUser: Worker | null;
  onSelectWorker: (worker: Worker) => void;
};

const Sidebar = ({ workers, selectedUser, onSelectWorker }: Props) => {
  const [search, setSearch] = useState("");

  // FILTER WORKERS
  const filteredWorkers = workers.filter((worker) => {
    const fullName = `${worker.fname} ${worker.lname}`.toLowerCase();
    const message = worker.lastMessage?.toLowerCase() || "";
    const keyword = search.toLowerCase();

    return fullName.includes(keyword) || message.includes(keyword);
  });

  return (
    <div className="w-[160px] max-w-[160px] min-w-[220px] bg-white shadow-md rounded-2xl p-4 flex-shrink-0">
      <h2 className="text-lg font-bold mb-4">Admin</h2>

      {/* SEARCH */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border bg-gray-100 focus:outline-none"
        />
        <FaSearch className="absolute right-3 top-3 text-gray-400" />
      </div>

      {/* LIST */}
      <div className="overflow-y-auto h-[calc(100vh-300px)]">
        {filteredWorkers.length === 0 ? (
          <div className="text-center text-gray-400 mt-6 text-sm">
            Not Found
          </div>
        ) : (
          filteredWorkers.map((worker) => (
            <div
              key={worker.user_id}
              onClick={() => onSelectWorker(worker)}
              className={`flex items-center p-3 cursor-pointer rounded-lg hover:bg-gray-200 ${
                selectedUser?.user_id === worker.user_id
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
            >
              <div className="relative w-10 h-10 mr-3">
                <img
                  src={
                    worker.profile_pic
                      ? `http://localhost:8081/uploads/images/${worker.profile_pic}`
                      : "/fallback.jpg"
                  }
                  className="w-full h-full rounded-full"
                />

                {worker.status === "active" && (
                  <div className="absolute w-3 h-3 bg-green-500 rounded-full bottom-0 right-0 border-2 border-white"></div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">
                  {worker.fname} {worker.lname}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {worker.lastMessage}
                </p>
              </div>

              <span className="text-xs text-gray-400">{worker.lastActive}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
