// src/components/ProfileWorker/index.tsx

import ProfileSettings from "./ProfileSettings";

const ProfileWorker = () => {
  const user_id = sessionStorage.getItem("user_id");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-semibold text-gray-800 dark:text-white">
        My Profile Settings
      </h1>

      <div className="w-full">
        <ProfileSettings user_id={user_id} />
      </div>
    </div>
  );
};

export default ProfileWorker;
