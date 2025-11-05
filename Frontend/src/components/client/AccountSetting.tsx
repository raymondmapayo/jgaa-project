import { notification } from "antd"; // Import notification from Ant Design
import axios from "axios";
import { useEffect, useState } from "react";

interface UsersItem {
  user_id: number;
  fname: string;
  lname: string;
  pnum: string;
  email: string;
  address: string;
  profile_pic: string;
}

const AccountSetting = () => {
  const [userData, setUserData] = useState<UsersItem | null>(null);
  const [initialData, setInitialData] = useState<UsersItem | null>(null); // Store initial data
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // State for saving process
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  // Get the user_id from sessionStorage
  const user_id = sessionStorage.getItem("user_id");

  // Fetch user data from the server
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_user/${user_id}`);
      console.log("Fetched Data:", response.data);
      setUserData(response.data || null);
      setInitialData(response.data || null); // Save the initial data for reset
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false); // Set loading to false after data is fetched
    }
  };

  // Trigger fetch when the component mounts or when user_id changes
  useEffect(() => {
    if (user_id) {
      fetchUserData();
    }
  }, [user_id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // ✅ ADDED: Allowed types for Cloudinary
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      // ✅ ADDED: Max size (Cloudinary allows larger, adjust as needed)
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        notification.error({
          message: "Invalid File Type",
          description: "Only JPG, GIF, or PNG files are allowed.",
        });
        return;
      }

      if (file.size > maxSize) {
        notification.error({
          message: "File Too Large",
          description: "Maximum file size is 5MB (Cloudinary limit).",
        });
        return;
      }

      setNewProfilePic(file);
    }
  };

  // Reset the form to its initial state (Cancel changes)
  const handleCancelChanges = () => {
    setUserData(initialData); // Reset to initial data
    setNewProfilePic(null); // Reset profile picture selection
  };

  // Save changes including profile picture upload
  const handleSaveChanges = async () => {
    if (!userData || !initialData) return;

    // Check if any changes were made
    const isDataChanged =
      userData.fname !== initialData.fname ||
      userData.lname !== initialData.lname ||
      userData.email !== initialData.email ||
      userData.pnum !== initialData.pnum ||
      userData.address !== initialData.address ||
      newProfilePic !== null; // Include profile picture change

    if (!isDataChanged) {
      notification.warning({
        message: "No Changes Detected",
        description:
          "No changes have been made. Please modify your data before saving.",
      });
      return;
    }

    setIsSaving(true); // Start loading when saving

    const formData = new FormData();
    formData.append("user_id", userData.user_id.toString());
    formData.append("fname", userData.fname);
    formData.append("lname", userData.lname);
    formData.append("email", userData.email);
    formData.append("pnum", userData.pnum);
    formData.append("address", userData.address);

    // If a new profile picture is selected, append it to FormData
    if (newProfilePic) {
      formData.append("profile_pic", newProfilePic);
    } else {
      formData.append("profile_pic", userData.profile_pic); // Keep the existing profile pic
    }

    try {
      const response = await axios.put(
        `${apiUrl}/update_user/${userData.user_id}`,
        formData
      );
      console.log("User updated:", response.data);

      // Update sessionStorage so other components reflect the new name
      sessionStorage.setItem("fname", userData.fname);
      sessionStorage.setItem("lname", userData.lname);
      sessionStorage.setItem("email", userData.email);
      sessionStorage.setItem("phone", userData.pnum);
      sessionStorage.setItem("address", userData.address);

      // Success notification
      notification.success({
        message: "Changes Saved Successfully",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating user:", error);

      notification.error({
        message: "Error Saving Changes",
        description:
          "An error occurred while saving changes. Please try again.",
      });
    } finally {
      setIsSaving(false); // Stop loading after save
    }
  };

  // Show loading state while fetching data
  if (isLoading) {
    return <div className="text-lg font-medium">Loading...</div>;
  }

  // Handle case where no user data is available
  if (!userData) {
    return (
      <div className="text-lg font-medium text-gray-600">
        No user data available
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Account Settings
      </h1>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        {/* Profile Photo Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start mb-8 gap-4 md:gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={
                newProfilePic
                  ? URL.createObjectURL(newProfilePic)
                  : userData.profile_pic
                  ? userData.profile_pic.startsWith("http")
                    ? userData.profile_pic
                    : `${apiUrl}/uploads/images/${userData.profile_pic}`
                  : "/avatar.jpg"
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="profile-upload"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium cursor-pointer"
              >
                {newProfilePic ? "Change photo" : "Upload new photo"}
              </label>
              {newProfilePic && (
                <button
                  onClick={() => setNewProfilePic(null)}
                  className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-2 font-light">
              Allowed JPG, GIF, or PNG. Max size of 5MB.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              First Name
            </label>
            <input
              type="text"
              value={userData.fname}
              onChange={(e) =>
                setUserData({ ...userData, fname: e.target.value })
              }
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={userData.lname}
              onChange={(e) =>
                setUserData({ ...userData, lname: e.target.value })
              }
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={userData.pnum}
              onChange={(e) =>
                setUserData({ ...userData, pnum: e.target.value })
              }
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Address
            </label>
            <input
              type="text"
              value={userData.address}
              onChange={(e) =>
                setUserData({ ...userData, address: e.target.value })
              }
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Buttons Section */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={handleCancelChanges}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSetting;
