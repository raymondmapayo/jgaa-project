const apiUrl = import.meta.env.VITE_API_URL;

export const getAvatarUrl = (pic?: string | null) =>
  pic?.startsWith("http")
    ? pic
    : pic
      ? `${apiUrl}/uploads/images/${pic}`
      : "/avatar.jpg";

// "now", "5m", "3h", "2d"
export const timeAgo = (timestamp?: string | null) => {
  if (!timestamp) return "";
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000),
  );
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

// Online = logged in within the last 30 minutes
export const isOnline = (user: any) =>
  !!user?.user_login_time &&
  Date.now() - new Date(user.user_login_time).getTime() < 30 * 60 * 1000;
