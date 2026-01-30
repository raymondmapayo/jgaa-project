// OrderDetailsModal.tsx
import { message, Modal, Spin } from "antd";
import axios from "axios";
import React, { useState } from "react";
import GCashButton from "../animation/GCashButton";
import useStore from "../zustand/store/store";
import { Swiper, SwiperSlide } from "swiper/react";

interface OrderDetailsModalProps {
  visible: boolean;
  checkoutItems: any[];
  finalTotal: number;
  onCancel: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  checkoutItems,
  finalTotal,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [showGCash, setShowGCash] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const client = useStore((state) => state.client) || {};
  const userId = sessionStorage.getItem("user_id");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Helper: create order only once
  const createOrder = async (paymentMethod: "GCash") => {
    if (orderId) return orderId; // Already created

    const data = checkoutItems.map((item) => ({
      user_id: userId,
      item_name: item.item_name,
      quantity: item.quantity,
      price: item.price,
      menu_img: item.menu_img,
      final_total: item.price * item.quantity,
      categories_name: item.categories_name || "Uncategorized",
      size: item.size || "Normal size",
    }));

    const response = await axios.post(`${apiUrl}/create_order/${userId}`, {
      orderData: data,
      payment_method: paymentMethod,
    });

    const createdOrderId = response.data.orderId;
    if (!createdOrderId) throw new Error("Failed to create order");

    setOrderId(createdOrderId);
    return createdOrderId;
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      const data = checkoutItems.map((item) => ({
        user_id: userId,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        menu_img: item.menu_img,
        final_total: item.price * item.quantity,
        categories_name: item.categories_name || "Uncategorized",
        size: item.size || "Normal size",
      }));

      const createdOrderId = await createOrder("GCash");

      const orderItems = data.map((item) => ({
        order_id: createdOrderId,
        user_id: userId,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        menu_img: item.menu_img,
        final_total: item.final_total,
        size: item.size,
        categories_name: item.categories_name,
      }));

      await axios.post(`${apiUrl}/create_order_items/${userId}`, {
        orderItems,
      });

      await axios.post(`${apiUrl}/activity_user/${userId}`, {
        user_id: userId,
        activity_date: new Date(),
        order_id: createdOrderId,
      });

      await axios.post(`${apiUrl}/remove_from_cart/${userId}`, { items: data });

      console.log(
        "GCash: order created and left as pending. Waiting for verification.",
      );

      onCancel();
      message.success("Order placed successfully and cart cleared!");
      useStore.setState({ client: { ...client, cart: [] } });
    } catch (error: any) {
      console.error(
        "Payment process failed:",
        error?.response?.data || error?.message || error,
      );
      message.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "An error occurred while processing your payment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleShowGCash = async () => {
    try {
      await createOrder("GCash");
      setShowGCash(true);
    } catch {
      message.error("Failed to initiate GCash payment. Please try again.");
    }
  };
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      className="modern-checkout-modal"
      maskStyle={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden select-none animate-[fadeIn_.25s_ease]">
        {/* Scrollable Container */}
        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6 custom-scroll">
          {/* ORDER SUMMARY */}
          <div>
            <h3 className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100 tracking-wide mb-4">
              Order Summary
            </h3>

            {/** MOBILE + TABLET → SWIPER SLIDER */}
            <div className="block lg:hidden">
              <Swiper
                spaceBetween={12}
                pagination={{ clickable: true }}
                slidesPerView={1.2}
                grabCursor={true}
              >
                {checkoutItems.map((product, idx) => (
                  <SwiperSlide key={idx}>
                    <div className="bg-gray-100 dark:bg-[#1e293b] rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center">
                      <img
                        src={
                          product.menu_img
                            ? product.menu_img.startsWith("http")
                              ? product.menu_img
                              : `${apiUrl}/uploads/images/${product.menu_img}`
                            : "https://via.placeholder.com/96?text=No+Image"
                        }
                        alt={product.item_name}
                        className="w-24 h-24 object-cover rounded-md mb-3"
                      />

                      <div className="text-center space-y-0.5">
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {product.item_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {product.quantity}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Size: {product.size || "Normal"}
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ₱{product.price * product.quantity}
                        </p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/** DESKTOP → GRID VIEW */}
            <ul className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {checkoutItems.map((product, idx) => (
                <li
                  key={idx}
                  className="bg-gray-100 dark:bg-[#1e293b] rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center"
                >
                  <img
                    src={
                      product.menu_img
                        ? product.menu_img.startsWith("http")
                          ? product.menu_img
                          : `${apiUrl}/uploads/images/${product.menu_img}`
                        : "https://via.placeholder.com/96?text=No+Image"
                    }
                    alt={product.item_name}
                    className="w-24 h-24 object-cover rounded-md mb-3"
                  />

                  <div className="text-center space-y-0.5">
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {product.item_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Qty: {product.quantity}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Size: {product.size || "Normal"}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₱{product.price * product.quantity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Grand Total:
              <span className="text-2xl font-bold text-red-600 dark:text-red-400 ml-2">
                ₱{finalTotal}
              </span>
            </p>

            {loading && (
              <div className="flex justify-center items-center mt-4">
                <Spin size="large" />
              </div>
            )}
          </div>

          {/* PAYMENT METHOD */}
          <div className="pt-4">
            <h4 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">
              Payment Method
            </h4>

            <div
              className="flex flex-col items-center p-5 mt-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-md hover:shadow-xl hover:bg-gray-50 dark:hover:bg-[#1e293b] cursor-pointer transition-all duration-200"
              onClick={handleShowGCash}
            >
              <img
                src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b3AyZXdsZGRxN3g1emxzbHVjamhtb2ZzNG4xaGhpdGZyN2FkdWZicyZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/MADYD4WF9g1b78RvE4/giphy.gif"
                alt="GCash"
                className="w-28 h-28 object-contain mb-3"
              />
              <p className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                GCash
              </p>
            </div>

            {showGCash && orderId && (
              <div className="mt-4">
                <GCashButton
                  amount={finalTotal}
                  finalTotal={finalTotal} // ← ADD THIS
                  orderId={orderId}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={(err) => console.error(err)}
                  menuImg={checkoutItems[0]?.menu_img || ""}
                  orderQuantity={checkoutItems.reduce(
                    (a, b) => a + b.quantity,
                    0,
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;
