import { notification } from "antd";
import { type StateCreator } from "zustand/vanilla";

interface WorkerState {
  loading?: boolean;
  info?: any | null;
  isAuthenticated?: boolean;
}

export interface WorkerSlice {
  worker: WorkerState | null;
  saveworkerInfo: (payload: any) => void;
  logoutworker: () => void;
}

const initialState: WorkerState = {
  loading: false,
  info: null,
  isAuthenticated: false,
};

const createWorkerSlice: StateCreator<WorkerSlice> = (set) => ({
  worker: initialState,

  saveworkerInfo: async (payload: any) => {
    try {
      if (!payload || !payload.fname) {
        throw new Error("Invalid login data. Please try again.");
      }

      set((state) => ({
        ...state,
        worker: {
          ...state.worker,
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
  logoutworker: async () => {
    try {
      const user_id = sessionStorage.getItem("user_id");

      if (!user_id) throw new Error("User ID not found.");

      console.log("Logging out worker user_id:", user_id);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/worker/logout/${user_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();
      console.log("Worker logout response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to log out on server.");
      }

      // ✅ CLEAR STORAGE (FIXED)
      sessionStorage.removeItem("user_id");
      sessionStorage.removeItem("role");

      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("fname");
      localStorage.removeItem("email");
      localStorage.removeItem("userId"); // safe to remove if exists

      // ✅ RESET STATE
      set(() => ({ worker: initialState }));

      notification.success({
        message: "Logout Successful",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Worker Logout error:", error);

      notification.error({
        message: "Logout Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while logging out.",
      });
    }
  },
});

export default createWorkerSlice;
