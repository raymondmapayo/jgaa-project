import {
  CheckCircleFilled,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { notification } from "antd";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

// Define the structure of the user data
interface UsersItem {
  user_id: number;
  fname: string;
  lname: string;
  pnum: string;
  email: string;
  address: string;
  profile_pic: string;
}

// Define the props for ProfileSettings, accepting user_id
interface ProfileSettingsProps {
  user_id: string | null;
}

const MAX_PHOTO_SIZE = 800 * 1024; // 800 KB, as stated in the upload hint

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const cardClass =
  "overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_-12px_rgba(30,64,175,0.15)] ring-1 ring-blue-100";

/* ======================= Password strength ======================= */

const getStrength = (value: string) => {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { label: "Too short", text: "text-gray-400", bar: "bg-gray-300" },
    { label: "Weak", text: "text-red-500", bar: "bg-red-500" },
    { label: "Fair", text: "text-yellow-600", bar: "bg-yellow-500" },
    { label: "Good", text: "text-blue-600", bar: "bg-blue-500" },
    { label: "Strong", text: "text-green-600", bar: "bg-green-500" },
  ];
  return { score, ...levels[score] };
};

/* ======================= Security card ======================= */

const SecurityCard = ({ user_id }: { user_id: string | null }) => {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false); // State for saving process
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    useState<boolean>(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const strength = getStrength(password);
  const passwordsMatch = confirmPassword !== "" && password === confirmPassword;

  const handlePasswordChange = async () => {
    if (!password || !confirmPassword) {
      notification.error({
        message: "Error",
        description: "Both password fields must be filled out.",
      });
      return;
    }

    if (password !== confirmPassword) {
      notification.error({
        message: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    setIsSaving(true); // Set isSaving to true when the password update starts

    try {
      const response = await axios.put(`${apiUrl}/update_password/${user_id}`, {
        password,
      });

      // Check response or status to ensure successful update
      if (response.status === 200) {
        notification.success({
          message: "Password Updated Successfully",
          description: "Your password has been updated.",
        });
        setPassword("");
        setConfirmPassword("");
      } else {
        notification.error({
          message: "Error Updating Password",
          description: "There was an issue updating your password.",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      notification.error({
        message: "Error Updating Password",
        description: "An error occurred while updating the password.",
      });
    } finally {
      setIsSaving(false); // Reset isSaving once the request is complete
    }
  };

  const eyeButtonClass =
    "absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500";

  return (
    <section className={cardClass}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-500/30">
          <LockOutlined />
        </span>
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-extrabold text-gray-900">
            Password & security
          </h2>
          <p className="m-0 text-sm text-gray-500">
            Keep your account safe with a strong password.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-6 py-6">
        {/* New password */}
        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Enter new password"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((v) => !v)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              className={eyeButtonClass}
            >
              {passwordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>

          {/* Strength meter */}
          {password && (
            <div className="mt-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 flex-1 rounded-full ${
                      strength.score >= step ? strength.bar : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p
                className={`m-0 mt-1.5 text-xs font-semibold ${strength.text}`}
              >
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirm-password"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={confirmPasswordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible((v) => !v)}
              aria-label={
                confirmPasswordVisible ? "Hide password" : "Show password"
              }
              className={eyeButtonClass}
            >
              {confirmPasswordVisible ? (
                <EyeInvisibleOutlined />
              ) : (
                <EyeOutlined />
              )}
            </button>
          </div>

          {confirmPassword && (
            <p
              className={`m-0 mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                passwordsMatch ? "text-green-600" : "text-red-500"
              }`}
            >
              {passwordsMatch ? (
                <>
                  <CheckCircleFilled /> Passwords match
                </>
              ) : (
                "Passwords do not match yet"
              )}
            </p>
          )}
        </div>

        <p className="m-0 rounded-2xl bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
          Tip: use at least 8 characters with upper and lower case letters,
          numbers and symbols.
        </p>

        <button
          type="button"
          onClick={handlePasswordChange}
          disabled={isSaving}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Update password"}
        </button>
      </div>
    </section>
  );
};

/* ======================= Profile page ======================= */

const ProfileSettings = ({ user_id }: ProfileSettingsProps) => {
  const [userData, setUserData] = useState<UsersItem | null>(null);
  const [initialData, setInitialData] = useState<UsersItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_user/${user_id}`);
      setUserData(response.data || null);
      setInitialData(response.data || null);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user_id) fetchUserData();
  }, [user_id]);

  // One preview URL per selected photo (cleaned up when it changes)
  useEffect(() => {
    if (!newProfilePic) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newProfilePic);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newProfilePic]);

  const hasChanges = useMemo(
    () =>
      newProfilePic !== null ||
      JSON.stringify(userData) !== JSON.stringify(initialData),
    [userData, initialData, newProfilePic],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notification.error({
        message: "Invalid File Type",
        description: "Please choose a JPG, GIF, or PNG image.",
      });
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      notification.error({
        message: "Photo Too Large",
        description: "The photo must be 800 KB or smaller.",
      });
      return;
    }

    setNewProfilePic(file);
  };

  const handleCancelChanges = () => {
    setUserData(initialData);
    setNewProfilePic(null);
  };

  const handleSaveChanges = async () => {
    if (!userData) return;

    setIsSaving(true);
    const formData = new FormData();
    formData.append("user_id", userData.user_id.toString());
    formData.append("fname", userData.fname);
    formData.append("lname", userData.lname);
    formData.append("email", userData.email);
    formData.append("pnum", userData.pnum);
    formData.append("address", userData.address);

    if (newProfilePic) formData.append("profile_pic", newProfilePic);
    else formData.append("profile_pic", userData.profile_pic);

    try {
      await axios.put(`${apiUrl}/update_user/${userData.user_id}`, formData);

      notification.success({
        message: "Changes Saved Successfully",
        description: "Your changes have been saved successfully.",
      });

      // Reload so "Cancel" and the photo reflect what was just saved
      await fetchUserData();
      setNewProfilePic(null);
    } catch (error) {
      console.error("Error updating user:", error);
      notification.error({
        message: "Error Saving Changes",
        description:
          "An error occurred while saving changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- Loading / empty ---------- */

  if (isLoading)
    return (
      <div className="w-full p-6">
        <div className="mb-6 h-9 w-56 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-[480px] animate-pulse rounded-3xl bg-gray-100 lg:col-span-2" />
          <div className="h-[480px] animate-pulse rounded-3xl bg-gray-100" />
        </div>
      </div>
    );

  if (!userData)
    return (
      <div className="w-full p-6">
        <div className="mx-auto max-w-md rounded-3xl bg-white px-8 py-14 text-center shadow-[0_10px_40px_-12px_rgba(30,64,175,0.15)] ring-1 ring-blue-100">
          <p className="m-0 text-lg font-bold text-gray-900">
            No user data available
          </p>
          <p className="m-0 mt-1 text-sm text-gray-500">
            We couldn’t load your profile. Please try again later.
          </p>
        </div>
      </div>
    );

  const photoSrc =
    previewUrl ??
    (userData.profile_pic
      ? userData.profile_pic.startsWith("http")
        ? userData.profile_pic
        : `${apiUrl}/uploads/images/${userData.profile_pic}`
      : "/avatar.jpg");

  const fullName = `${userData.fname} ${userData.lname}`.trim();

  return (
    <div className="w-full p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-gray-900">
          Account settings
        </h1>
        <p className="m-0 mt-1 text-sm text-gray-500">
          Manage your profile information and password.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* ================= Profile card ================= */}
        <section className={`${cardClass} lg:col-span-2`}>
          {/* Banner */}
          <div className="relative h-28 overflow-hidden bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe,transparent_50%)] bg-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-blue-200/70" />
            <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full border border-blue-200/70" />
          </div>

          {/* Avatar + actions */}

          {/* Avatar + actions */}
          <div className="relative z-10 -mt-12 flex flex-col gap-4 px-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <img
                src={photoSrc}
                alt="Profile"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/avatar.jpg";
                }}
                className="relative z-20 h-28 w-28 flex-shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-xl sm:h-32 sm:w-32"
              />

              <div className="min-w-0 pb-1">
                <p className="m-0 break-words text-xl font-extrabold text-gray-900">
                  {fullName || "Your name"}
                </p>
                <p className="m-0 break-all text-sm text-gray-500">
                  {userData.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1">
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />

              <label
                htmlFor="profile-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
              >
                <UploadOutlined />
                {newProfilePic ? "Change photo" : "Upload new photo"}
              </label>

              {newProfilePic && (
                <button
                  type="button"
                  onClick={() => setNewProfilePic(null)}
                  className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Undo
                </button>
              )}
            </div>
          </div>

          <p className="m-0 mt-3 px-6 text-xs text-gray-500">
            Allowed JPG, GIF, or PNG. Max size of 800K.
          </p>

          {/* Form */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="grid grid-cols-1 gap-5 px-6 pb-2 pt-6 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <h3 className="m-0 border-b border-dashed border-gray-200 pb-3 text-base font-bold text-gray-900">
                Personal information
              </h3>
            </div>

            <div>
              <label
                htmlFor="fname"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                First name
              </label>
              <input
                id="fname"
                type="text"
                value={userData.fname}
                onChange={(e) =>
                  setUserData({ ...userData, fname: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="lname"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Last name
              </label>
              <input
                id="lname"
                type="text"
                value={userData.lname}
                onChange={(e) =>
                  setUserData({ ...userData, lname: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="pnum"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Phone number
              </label>
              <input
                id="pnum"
                type="text"
                value={userData.pnum}
                onChange={(e) =>
                  setUserData({ ...userData, pnum: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Address
              </label>
              <input
                id="address"
                type="text"
                value={userData.address}
                onChange={(e) =>
                  setUserData({ ...userData, address: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="mt-4 flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-xs text-gray-500">
              {hasChanges ? "You have unsaved changes." : "All changes saved."}
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCancelChanges}
                disabled={!hasChanges || isSaving}
                className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </section>

        {/* ================= Security card ================= */}
        <SecurityCard user_id={user_id} />
      </div>
    </div>
  );
};

export default ProfileSettings;
