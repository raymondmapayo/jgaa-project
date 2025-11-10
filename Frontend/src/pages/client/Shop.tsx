import { Modal, notification } from "antd";
import React, { useEffect, useState } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { addToCart } from "../../zustand/store/store.provider";
import Favourites from "./Favourites";
import ProductInfo from "./ProductInfo";

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

  const fetchMenuItems = () => {
    fetch(`${apiUrl}/menu_items`)
      .then((res) => res.json())
      .then((data) => {
        const filteredItems = data
          .filter((item: any) => item.categories_name === type)
          .map((item: any) => ({
            ...item,
            id: item.menu_id,
          }));
        setMenuItems(filteredItems);
      })
      .catch((err) => console.error("Error fetching menu items:", err));
  };

  useEffect(() => {
    fetchMenuItems();
  }, [type]);

  useEffect(() => {
    const user_id = sessionStorage.getItem("user_id");
    if (!user_id) return;

    fetch(`${apiUrl}/get_user_favorites/${user_id}`)
      .then((res) => res.json())
      .then((data: number[]) => setFavorites(data))
      .catch((err) => console.error("Error fetching user favorites:", err));
  }, []);

  const toggleFavorite = (menu_id: number) => {
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

    fetch(`${apiUrl}/toggle_user_favorites/${menu_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFavorites((prev) =>
            data.action === "added"
              ? [...prev, menu_id]
              : prev.filter((id) => id !== menu_id)
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
        }
      })
      .catch((err) => console.error("Error toggling favourite:", err));
  };

  const handleViewMenuClick = (item: MenuItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orange-500">{type}</h1>
      </header>

      {menuItems.length === 0 ? (
        <div className="font-core text-center text-xl text-gray-500">
          No items yet in this category
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#fff7ec] cursor-pointer border border-gray-200 rounded-lg shadow-lg overflow-hidden relative p-6 text-center flex flex-col h-full **min-w-[260px]**"
            >
              {/* ❤️ Favourites */}
              <Favourites
                menuId={item.id}
                isFavorited={favorites.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />

              {/* 🖼️ Image */}
              <div className="relative w-28 h-28 mx-auto mt-2">
                <img
                  src={
                    item.menu_img
                      ? item.menu_img.startsWith("http")
                        ? item.menu_img
                        : `${apiUrl}/uploads/images/${item.menu_img}?v=${item.menu_id}`
                      : "https://via.placeholder.com/150?text=No+Image"
                  }
                  alt={item.item_name}
                  className="h-28 w-28 object-cover rounded-full border-4 border-orange-500 shadow-md"
                />
              </div>

              {/* 📝 Content */}

              <div className="mt-3 flex-grow flex flex-col justify-between items-center text-center">
                <h2 className="font-core text-lg font-semibold text-orange-600">
                  {item.item_name}
                </h2>
                <p className="text-sm text-gray-600 mt-1 line-clamp-3 text-justify">
                  {item.description}
                </p>
                <p className="text-md text-gray-800 mt-2 self-start">
                  ₱{item.price}
                </p>

                {/* ⚡ Buttons */}
                <div className="mt-3 flex flex-row flex-wrap items-center justify-center gap-2 w-full">
                  {item.availability?.trim().toLowerCase() === "available" ? (
                    <>
                      <button
                        onClick={() => handleViewMenuClick(item)}
                        className="font-core flex-1 min-w-[120px] flex items-center justify-center px-3 py-2 text-sm font-semibold text-orange-500 border border-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-300 whitespace-nowrap"
                      >
                        View Menu
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="font-core flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-orange-500 border border-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-300 whitespace-nowrap"
                      >
                        <FaShoppingBag />
                        Add to Cart
                      </button>
                    </>
                  ) : (
                    <span className="font-core flex-1 min-w-[120px] flex items-center justify-center px-3 py-2 text-sm font-semibold text-red-500 border border-red-500 rounded-full bg-red-100">
                      Ops! Sorry, We're not Available today.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🪟 Modal */}
      <Modal
        key={selectedItem?.id || "menu-modal"}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        bodyStyle={{ padding: "20px" }}
        width={800}
        destroyOnClose
      >
        {selectedItem && (
          <ProductInfo key={selectedItem.id} item={selectedItem} />
        )}
      </Modal>
    </section>
  );
};

export default Shop;
