import { notification } from "antd";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { addToCart } from "../../zustand/store/store.provider";
import Favourites from "./Favourites";

import OrderDetailsModal from "../../clientsmodal/OrderDetailsModal";

interface MenuItem {
  id: number;
  menu_id: number;
  item_name: string;
  menu_img: string;
  description: string;
  price: number;
  categories_name: string;
  availability: string;
  quantity?: number;
  size?: string;
}

const Shop: React.FC = () => {
  const { type } = useParams();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const refreshMenuItems = async () => {
    try {
      const res = await fetch(`${apiUrl}/menu_items`);
      const data = await res.json();

      const filteredItems = data
        .filter((item: any) => item.categories_name === type)
        .map((item: any) => ({
          ...item,
          id: item.menu_id,
        }));

      setMenuItems(filteredItems);
    } catch (err) {
      console.error("Error fetching menu items:", err);
    }
  };

  useEffect(() => {
    refreshMenuItems();
  }, [type]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const user_id = sessionStorage.getItem("user_id");

        if (!user_id) {
          setFavorites([]);
          return;
        }

        const res = await fetch(`${apiUrl}/get_user_favorites/${user_id}`);

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch user favorites");
        }

        if (Array.isArray(data)) {
          setFavorites(data);
        } else if (data.success && Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error("❌ Error fetching user favorites:", err);
        setFavorites([]);
      }
    };

    fetchFavorites();
  }, [apiUrl]);

  const toggleFavorite = async (menu_id: number) => {
    const user_id = sessionStorage.getItem("user_id");

    if (!user_id) {
      notification.warning({
        message: "Please Login First",
        description:
          "You need to login before adding items to your favourites.",
        placement: "topRight",
      });
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/toggle_user_favorites/${menu_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to toggle favorite");
      }

      if (data.success) {
        setFavorites((prev) =>
          data.action === "added"
            ? [...prev, menu_id]
            : prev.filter((id) => id !== menu_id),
        );

        notification.success({
          message:
            data.action === "added"
              ? "Added to Favourites"
              : "Removed from Favourites",
          description: `${
            menuItems.find((i) => i.id === menu_id)?.item_name
          } has been ${data.action} your favourites.`,
          placement: "topRight",
        });

        refreshMenuItems();
      }
    } catch (err) {
      console.error("Error toggling favourite:", err);
    }
  };

  // When clicking "Buy now" → show OrderDetailsModal
  const handleBuyNowClick = (item: MenuItem) => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) {
      notification.warning({
        message: "Login Required",
        description: "You need to login or register before buying items.",
      });
      return;
    }
    setSelectedItem({ ...item, quantity: 1 });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const isAvailable = (item: MenuItem) =>
    item.availability?.trim().toLowerCase() === "available";

  const availableCount = menuItems.filter(isAvailable).length;

  return (
    <section className="relative overflow-hidden rounded-3xl    sm:px-8 sm:py-12">
      {/* Ambient glow + grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0" />

      <div className="relative">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left"
        >
          <div>
            <h1 className="text-4xl font-bold capitalize tracking-tight text-slate-900 sm:text-5xl">
              {type}
            </h1>
            <p className="font-core mt-2 text-sm text-slate-500 sm:text-base">
              Fresh picks from our kitchen. Order now or add to your cart.
            </p>
          </div>

          {menuItems.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-core text-sm text-slate-700">
                {availableCount} of {menuItems.length} available today
              </span>
            </div>
          )}
        </motion.header>

        {menuItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-20 text-center">
            <p className="font-core text-xl font-semibold text-slate-800">
              No items yet in this category
            </p>
            <p className="font-core mt-1 text-sm text-slate-500">
              Check back soon, or browse another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menuItems.map((item, i) => {
              const available = isAvailable(item);

              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
                  whileHover={{}}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-shadow duration-300 ${
                    available
                      ? "border-slate-200 shadow-sm "
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {/* Top glow strip */}
                  <div
                    aria-hidden
                    className={`h-1 w-full ${
                      available ? "bg-gradient-to-r " : "bg-slate-200"
                    }`}
                  />

                  {/* Favourites */}
                  <Favourites
                    menuId={item.id}
                    isFavorited={favorites.includes(item.id)}
                    onToggleFavorite={toggleFavorite}
                  />

                  {/* Image */}
                  <div className="mt-6 flex justify-center">
                    <div className="relative">
                      {item.menu_img ? (
                        <img
                          src={
                            item.menu_img.startsWith("http")
                              ? item.menu_img
                              : `${apiUrl}/uploads/images/${item.menu_img}?v=${item.menu_id}`
                          }
                          alt={item.item_name}
                          className={`h-28 w-28 rounded-full object-cover ring-2 ring-offset-4 transition duration-500 group-hover:scale-105 ${
                            available
                              ? "ring-orange-400"
                              : "opacity-60 grayscale ring-slate-300"
                          }`}
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-orange-100 text-3xl font-semibold text-orange-600 ring-2 ring-orange-400 ring-offset-4">
                          {item.item_name?.[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-4 text-center">
                    <h2 className="font-core text-lg font-semibold text-slate-900">
                      {item.item_name}
                    </h2>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-500">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-core rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-base font-bold text-orange-600">
                        ₱{item.price}
                      </span>
                      <span
                        className={`font-core rounded-full border px-2.5 py-1 text-xs font-medium ${
                          available
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-600"
                        }`}
                      >
                        {available ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    {/* Buttons */}
                    <div className="mt-auto flex w-full flex-wrap gap-2 pt-4">
                      {available ? (
                        <>
                          <motion.button
                            onClick={() => handleBuyNowClick(item)}
                            className="font-core px-4 py-2 text-sm font-semibold text-orange-500 border border-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition whitespace-nowrap"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Buy now
                          </motion.button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                              refreshMenuItems();
                            }}
                            className="font-core flex min-w-[110px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-orange-300 bg-white px-3 py-2.5 text-sm font-semibold text-orange-600 outline-none transition hover:bg-orange-50 focus-visible:ring-4 focus-visible:ring-orange-300/40 active:scale-[0.98]"
                          >
                            <FaShoppingBag />
                            Add to cart
                          </button>
                        </>
                      ) : (
                        <span className="font-core w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-sm font-semibold text-red-600">
                          We're not available today.
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Order details modal */}
      {selectedItem && (
        <OrderDetailsModal
          visible={modalVisible}
          checkoutItems={[selectedItem]}
          finalTotal={selectedItem.price * (selectedItem.quantity || 1)}
          onCancel={closeModal}
        />
      )}
    </section>
  );
};

export default Shop;
