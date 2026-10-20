import { Modal, notification } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { addToCart } from "../../zustand/store/store.provider";
import Favourites from "./Favourites";
import ProductInfo from "./ProductInfo";

// `id` is mapped from menu_id for ProductInfo compatibility
interface FavouriteItem {
  id: number;
  user_favourites_id: number;
  menu_id: number;
  item_name: string;
  menu_img: string;
  description: string;
  price: number;
  availability: string;
  categories_name: string;
}

type Filter = "All" | "Available";

const peso = (n: number) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;

const isAvailable = (item: FavouriteItem) =>
  item.availability?.trim().toLowerCase() === "available";

const MyFavourites: React.FC = () => {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FavouriteItem | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const user_id = sessionStorage.getItem("user_id");
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!user_id) {
      setFavourites([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(`${apiUrl}/get_user_favourites_full/${user_id}`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch favourites");
        }

        return data;
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setFavourites(
            data.map((item: FavouriteItem) => ({
              ...item,
              id: item.menu_id,
            })),
          );
        } else {
          setFavourites([]);
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching favourites:", err);
        setFavourites([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiUrl, user_id]);

  const toggleFavorite = (menu_id: number) => {
    if (!user_id) {
      notification.warning({
        message: "Log in to manage favourites",
        description: "You need to be logged in to change your favourites.",
        placement: "topRight",
      });
      return;
    }

    // Read the name now, before the list changes
    const itemName = favourites.find((i) => i.menu_id === menu_id)?.item_name;

    fetch(`${apiUrl}/toggle_user_favorites/${menu_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        if (data.action === "removed") {
          setFavourites((prev) => prev.filter((i) => i.menu_id !== menu_id));
        }
        notification.success({
          message:
            data.action === "added"
              ? "Added to favourites"
              : "Removed from favourites",
          description: itemName
            ? `${itemName} was ${data.action} ${data.action === "added" ? "to" : "from"} your favourites.`
            : undefined,
          placement: "topRight",
        });
      })
      .catch((err) => {
        console.error(err);
        notification.error({
          message: "Couldn't update favourites",
          description: "Check your connection and try again.",
          placement: "topRight",
        });
      });
  };

  const handleAddToCart = (item: FavouriteItem) => {
    addToCart(item);
    notification.success({
      message: "Added to cart",
      description: item.item_name,
      placement: "topRight",
      duration: 2,
    });
  };

  const openModal = (item: FavouriteItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const availableCount = useMemo(
    () => favourites.filter(isAvailable).length,
    [favourites],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return favourites.filter((item) => {
      if (filter === "Available" && !isAvailable(item)) return false;
      if (!q) return true;
      return (
        item.item_name.toLowerCase().includes(q) ||
        (item.categories_name || "").toLowerCase().includes(q)
      );
    });
  }, [favourites, filter, query]);

  const imgSrc = (img: string) =>
    img
      ? img.startsWith("http")
        ? img
        : `${apiUrl}/uploads/images/${img}`
      : "https://via.placeholder.com/300?text=No+Image";

  return (
    <section className="font-core container mx-auto min-h-screen px-4 py-10">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Your favourites</h1>
          <p className="mt-1 text-sm text-stone-500">
            {loading
              ? "Loading your saved dishes…"
              : favourites.length === 0
                ? "Save dishes you love to order them faster."
                : `${favourites.length} saved ${favourites.length === 1 ? "dish" : "dishes"} · ${availableCount} available today`}
          </p>
        </div>

        {favourites.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your favourites"
              aria-label="Search favourites"
              className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 sm:w-60"
            />
            <div className="flex gap-2">
              {(["All", "Available"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                    filter === f
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100"
            >
              <div className="h-44 bg-stone-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 rounded bg-stone-200" />
                <div className="h-3 w-full rounded bg-stone-200" />
                <div className="h-9 w-full rounded-full bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && favourites.length === 0 && (
        <div className="mx-auto mt-10 max-w-md rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-stone-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-2xl">
            ❤️
          </div>
          <h2 className="text-lg font-semibold text-stone-900">
            {user_id ? "No favourites yet" : "Log in to see your favourites"}
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">
            {user_id
              ? "Tap the heart on any dish to save it here."
              : "Your saved dishes will show up here once you're logged in."}
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Browse the menu
          </a>
        </div>
      )}

      {!loading && favourites.length > 0 && visible.length === 0 && (
        <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">No matches</h2>
          <p className="mt-1 text-sm text-stone-500">
            Try a different search or show all favourites.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setFilter("All");
            }}
            className="mt-5 rounded-full border border-stone-300 px-6 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => {
            const available = isAvailable(item);
            return (
              <article
                key={item.user_favourites_id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 transition hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-stone-100">
                  <img
                    src={imgSrc(item.menu_img)}
                    alt={item.item_name}
                    loading="lazy"
                    className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
                      available ? "" : "grayscale opacity-60"
                    }`}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 backdrop-blur">
                    {item.categories_name}
                  </span>
                  <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur">
                    <Favourites
                      menuId={item.menu_id}
                      isFavorited={true}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                  {!available && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-medium text-white">
                      Not available today
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-stone-900">
                      {item.item_name}
                    </h2>
                    <span className="shrink-0 text-base font-bold text-orange-600">
                      {peso(item.price)}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">
                    {item.description}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <button
                      onClick={() => openModal(item)}
                      className="flex-1 rounded-full border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      Details
                    </button>
                    {available ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                      >
                        <FaShoppingBag className="text-xs" /> Add to cart
                      </button>
                    ) : (
                      <span className="flex-1 cursor-not-allowed rounded-full bg-stone-100 px-3 py-2 text-center text-sm font-medium text-stone-400">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Modal
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        bodyStyle={{ padding: "20px" }}
        width={800}
      >
        {selectedItem && <ProductInfo item={selectedItem} />}
      </Modal>
    </section>
  );
};

export default MyFavourites;
