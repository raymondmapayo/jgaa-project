import { notification } from "antd";
import { type StateCreator } from "zustand/vanilla";

interface AdminState {
  loading?: boolean;
  info?: any | null;
  isAuthenticated?: boolean;
}

export interface AdminSlice {
  admin: AdminState | null;
  saveadminInfo: (payload: any) => void;
  logoutadmin: () => void;
}

const initialState: AdminState = {
  loading: false,
  info: null,
  isAuthenticated: false,
};
const apiUrl = import.meta.env.VITE_API_URL;
const createAdminSlice: StateCreator<AdminSlice> = (set) => ({
  admin: initialState,

  saveadminInfo: async (payload: any) => {
    try {
      if (!payload || !payload.fname) {
        throw new Error("Invalid login data. Please try again.");
      }

      set((state) => ({
        ...state,
        admin: {
          ...state.admin,
          info: payload,
          isAuthenticated: true,
        },
      }));

      notification.success({
        message: "Login Successful",
        description: `Welcome back, ${payload.fname}!`,
      });
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "An error occurred while logging in.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      notification.error({
        message: "Login Failed",
        description: errorMessage,
      });
    }
  },

  logoutadmin: async () => {
    try {
      // ✅ Prefer sessionStorage for current logged-in admin ID
      const user_id =
        sessionStorage.getItem("user_id") || localStorage.getItem("userId");

      if (!user_id) {
        throw new Error("No user ID found. Cannot log out.");
      }

      console.log("Logging out user_id:", user_id);

      // ✅ Call backend to update status and last_active_time
      const response = await fetch(`${apiUrl}/admin/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });

      const data = await response.json();
      console.log("Logout response from backend:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to log out on server.");
      }

      // ✅ Clear frontend state
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("fname");
      localStorage.removeItem("email");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("user_id");

      set(() => ({ admin: initialState }));

      notification.success({
        message: "Logout Successful",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);

      let errorMessage = "An error occurred while logging out.";
      if (error instanceof Error) errorMessage = error.message;

      notification.error({
        message: "Logout Failed",
        description: errorMessage,
      });
    }
  },
});
export default createAdminSlice;
