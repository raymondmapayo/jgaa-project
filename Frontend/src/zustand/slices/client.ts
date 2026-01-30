/* eslint-disable @typescript-eslint/no-explicit-any */
import { notification } from "antd";
import axios from "axios";
import { type StateCreator } from "zustand/vanilla";

interface ClientState {
  loading?: boolean;
  info?: any | null;
  isAuthenticated?: boolean;
  cart?: any[];
  reservations?: number[];
  user_id?: number;
}

interface UserInfo {
  fname: string;
  lname: string;
  profile_pic: string;
}

export interface ClientSlice {
  client: ClientState | null;
  saveClientInfo: (payload: any) => void;
  info?: UserInfo | null;
  addToCart: (payload: any) => void;
  incrementCartItem: (productId: any, itemName: string) => void;
  decrementCartItem: (productId: any, itemName: string) => void;
  deleteCartItem: (productId: any) => void;
  logoutClient: () => void;
  reserveTable: (
    tableId: string,
    formData: {
      email: string;
      pnum: string;
      fullName: string;
      reservationTime: string;
      reservationDate: string;
      numOfPeople: string;
      status?: string;
      specialRequest?: string;
    },
    resetForm?: () => void
  ) => void;
}

const initialState: ClientState = {
  loading: false,
  info: null,
  isAuthenticated: false,
  cart: [],
  reservations: [],
};
const apiUrl = import.meta.env.VITE_API_URL;
const createClientSlice: StateCreator<ClientSlice> = (set) => ({
  client: initialState,

  saveClientInfo: async (payload: any) => {
    try {
      if (!payload) {
        throw new Error("Invalid login credentials.");
      }

      // Save user info in sessionStorage
      sessionStorage.setItem("user_id", payload.user_id);

      let cartItems = [];
      const userId = payload.user_id;

      if (userId) {
        const response = await fetch(`${apiUrl}/get_cart/${userId}`);
        if (response.ok) {
          cartItems = await response.json();
          console.log("Fetched cart items on login:", cartItems);
        } else {
          console.warn("Cart fetch failed with status", response.status);
        }
      }

      set((state) => ({
        ...state,
        client: {
          ...state.client,
          info: payload,
          isAuthenticated: true,
          cart: cartItems,
        },
      }));

      // Set up interval to refresh cart items every 30 seconds (example)
      const cartRefreshInterval = setInterval(async () => {
        try {
          const userId = sessionStorage.getItem("user_id");
          if (!userId) return;

          const response = await fetch(`${apiUrl}/get_cart/${userId}`);
          if (response.ok) {
            const updatedCart = await response.json();
            console.log("Cart updated via interval (30s):", updatedCart);
            set((state) => ({
              ...state,
              client: {
                ...state.client,
                cart: updatedCart,
              },
            }));
          }
        } catch (err) {
          console.warn("Cart refresh interval failed:", err);
        }
      }, 30000); // ✅ 30 seconds instead of 1s

      // Optional: Save the interval ID if you want to clear it later
      set((state) => ({
        ...state,
        cartRefreshInterval,
      }));

      notification.success({
        message: "Login Successful",
        description: `Welcome back, ${payload?.fname || "User"}!`,
      });
    } catch (error) {
      console.error("Login error:", error);

      notification.error({
        message: "Login Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while logging in.",
      });
    }
  },

  addToCart: async (product: any) => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) {
      notification.warning({
        message: "Login Required",
        description: "You need to login before adding items to the cart.",
      });
      return;
    }

    const itemToSend = {
      item_name: product.item_name,
      quantity: 1,
      availability: "true",
      categories_name: product.categories_name || "Unknown Category",
      price: product.price,
      menu_img: product.menu_img,
      menu_name: product.item_name,
      size: product.size || "Normal size",
    };

    try {
      // Send to backend
      await fetch(`${apiUrl}/add_to_cart/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [itemToSend] }),
      });

      set((state) => {
        const currentCart = state.client?.cart || [];

        const index = currentCart.findIndex(
          (item) =>
            item.item_name === product.item_name &&
            (item.size || "Normal size") === (product.size || "Normal size")
        );

        if (index > -1) {
          // Item exists, increment quantity
          const updatedCart = [...currentCart];
          updatedCart[index].quantity += 1;
          return { ...state, client: { ...state.client, cart: updatedCart } };
        } else {
          // New item
          return {
            ...state,
            client: {
              ...state.client,
              cart: [...currentCart, { ...itemToSend }],
            },
          };
        }
      });

      notification.success({
        message: `${product.item_name} added to cart!`,
        description: `${product.item_name} (${
          product.size || "Normal size"
        }) added successfully.`,
      });
    } catch (error) {
      console.error("Add to cart failed:", error);
      notification.error({
        message: "Add to Cart Failed",
        description: "Something went wrong while adding to cart.",
      });
    }
  },

  logoutClient: async () => {
    try {
      const userId = sessionStorage.getItem("user_id");
      if (!userId) throw new Error("User ID not found.");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/client/logout/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to log out on server.");

      console.log("Client logout response:", data);

      sessionStorage.clear();
      localStorage.removeItem("userId");

      set((state) => {
        if ((state as any).cartRefreshInterval)
          clearInterval((state as any).cartRefreshInterval);
        return { client: initialState };
      });

      notification.success({
        message: "Logout Successful",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Client Logout error:", error);
      notification.error({
        message: "Logout Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while logging out.",
      });
    }
  },

  reserveTable: (tableId: string, formData, resetForm) => {
    set((state) => {
      if (!state.client?.isAuthenticated) {
        notification.warning({
          message: "Login Required",
          description:
            "You need to login or register before reserving a table.",
        });
        return state;
      }

      if (
        !formData.email ||
        !formData.pnum ||
        !formData.specialRequest ||
        !formData.fullName ||
        !formData.reservationDate ||
        !formData.reservationTime ||
        !formData.numOfPeople
      ) {
        notification.warning({
          message: "Incomplete Details",
          description: "Please fill in all required fields before reserving.",
        });
        return state;
      }

      notification.success({
        message: "Table Reserved",
        description: `You have successfully reserved table ${tableId}.`,
      });

      if (resetForm) {
        resetForm();
      }

      return {
        ...state,
        client: {
          ...state.client,
          reservations: [
            ...(state.client?.reservations || []),
            Number(tableId),
          ],
        },
      };
    });
  },

  incrementCartItem: async (
    productId: any,
    itemName: string,
    size?: string
  ) => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) return;

    set((state) => {
      const cart = state.client?.cart || [];
      const updatedCart = cart.map((item) =>
        item.id === productId &&
        item.item_name === itemName &&
        (item.size || "Normal size") === (size || "Normal size")
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      return { ...state, client: { ...state.client, cart: updatedCart } };
    });

    try {
      await axios.post(`${apiUrl}/update_cart_quantity/${userId}`, {
        item_name: itemName,
        size: size || "Normal size",
        action: "increment",
      });
    } catch (err) {
      console.error("Failed to increment on backend:", err);
    }
  },

  decrementCartItem: async (
    productId: any,
    itemName: string,
    size?: string
  ) => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) return;

    set((state) => {
      const cart = state.client?.cart || [];
      const updatedCart = cart.map((item) =>
        item.id === productId &&
        item.item_name === itemName &&
        (item.size || "Normal size") === (size || "Normal size")
          ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
          : item
      );
      return { ...state, client: { ...state.client, cart: updatedCart } };
    });

    try {
      await axios.post(`${apiUrl}/update_cart_quantity/${userId}`, {
        item_name: itemName,
        size: size || "Normal size",
        action: "decrement",
      });
    } catch (err) {
      console.error("Failed to decrement on backend:", err);
    }
  },

  deleteCartItem: async (product: any) => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) return;

    try {
      await axios.delete(`${apiUrl}/remove_from_carts/${userId}`, {
        data: {
          item_name: product.item_name,
          size: product.size || "Normal size",
        },
      });

      set((state) => {
        const cart = state.client?.cart || [];
        const updatedCart = cart.filter(
          (item) =>
            !(
              item.item_name === product.item_name &&
              (item.size || "Normal size") === (product.size || "Normal size")
            )
        );

        notification.info({
          message: `${product.item_name} removed from the cart.`,
        });

        return { ...state, client: { ...state.client, cart: updatedCart } };
      });
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      notification.error({
        message: "Delete Failed",
        description: error?.response?.data?.message || "Something went wrong.",
      });
    }
  },
});

export default createClientSlice;
