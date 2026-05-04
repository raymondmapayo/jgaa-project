import { Avatar, Drawer, notification } from "antd";
import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  profilePic: string | null;
  userName: string | null;
  userEmail: string | null;
  apiUrl: string;
  setIsAccountSettingVisible: (v: boolean) => void;
  setIsLogVisible: (v: boolean) => void;
  setIsCommentUsVisible: (v: boolean) => void;
  handleLogout: () => void;
}

const UserDrawer: React.FC<Props> = ({
  open,
  onClose,
  profilePic,
  userName,
  userEmail,
  apiUrl,
  setIsAccountSettingVisible,
  setIsLogVisible,
  setIsCommentUsVisible,
  handleLogout,
}) => {
  // ✅ AUTH CHECK (same as your popover logic)
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";

  return (
    <Drawer
      title="Profile"
      placement="right"
      open={open}
      onClose={onClose}
      width={320}
      mask
      maskStyle={{ backgroundColor: "transparent" }}
      // 🔴 CHANGE #1 (IMPORTANT)
      bodyStyle={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      zIndex={2000}
    >
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Avatar
          size={52}
          src={
            profilePic?.startsWith("http")
              ? profilePic
              : profilePic
                ? `${apiUrl}/uploads/images/${profilePic}`
                : "/avatar.jpg"
          }
        />

        <div className="flex flex-col">
          <h3 className="font-semibold text-base text-gray-800">{userName}</h3>
          <p className="text-sm text-gray-500 break-all">{userEmail}</p>
        </div>
      </div>

      {/* ================= MENU ================= */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Account Setting */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              notification.info({
                message: "Authentication Required",
                description: "Please login first to access Account Settings.",
                placement: "topRight",
                duration: 2,
              });
              return;
            }

            setIsAccountSettingVisible(true);
            onClose();
          }}
          className="w-full flex items-center p-3 hover:bg-gray-100 text-gray-700 text-left"
        >
          <span className="flex-grow">Account Setting</span>
        </button>

        {/* My Purchase */}
        <Link
          to="/MyPurchase"
          onClick={(e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              notification.info({
                message: "Authentication Required",
                description: "Please login first to view your purchases.",
                placement: "topRight",
                duration: 2,
              });
              return;
            }

            onClose();
          }}
          className="block p-3 hover:bg-gray-100 text-gray-700"
        >
          My Purchase
        </Link>

        {/* My Favourites */}
        <Link
          to="/MyFavourates"
          onClick={(e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              notification.info({
                message: "Authentication Required",
                description: "Please login first to view your favourites.",
                placement: "topRight",
                duration: 2,
              });
              return;
            }

            onClose();
          }}
          className="block p-3 hover:bg-gray-100 text-gray-700"
        >
          My Favourites
        </Link>

        {/* Activity Log */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              notification.info({
                message: "Authentication Required",
                description: "Please login first to view your activity log.",
                placement: "topRight",
                duration: 2,
              });
              return;
            }

            setIsLogVisible(true);
            onClose();
          }}
          className="w-full flex items-center p-3 hover:bg-gray-100 text-gray-700 text-left"
        >
          <span className="flex-grow">Activity Log</span>
        </button>

        {/* Comment Us */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              notification.info({
                message: "Authentication Required",
                description: "Please login first to leave a comment.",
                placement: "topRight",
                duration: 2,
              });
              return;
            }

            setIsCommentUsVisible(true);
            onClose();
          }}
          className="w-full flex items-center p-3 hover:bg-gray-100 text-gray-700 text-left"
        >
          <span className="flex-grow">Comment Us</span>
        </button>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="border-t p-3 flex justify-center">
        <button
          onClick={() => {
            handleLogout();
            onClose();
          }}
          className="text-red-500 font-semibold text-lg hover:bg-gray-100 px-5 py-2 rounded text-center"
        >
          Sign Out
        </button>
      </div>
    </Drawer>
  );
};

export default UserDrawer;
