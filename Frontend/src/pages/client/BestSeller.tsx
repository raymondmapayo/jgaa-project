import { notification } from "antd";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaFire, FaShoppingBag } from "react-icons/fa";
import { CustomRate } from "../../components/client/Rate";
import { addToCart } from "../../zustand/store/store.provider";
import ClientsCommentsRated from "../ClientsModal/ClientsCommentsRated";
import OrderDetailsModal from "../../clientsmodal/OrderDetailsModal";

interface BestsellerProduct {
  bestseller_id?: number;
  item_name: string;
  menu_img: string;
  price: number;
  total_avg_rating: string;
  rating_count: number;
  availability?: string;
  categories_name?: string | null;
}

interface MenuItem {
  id: number;
  item_name: string;
  menu_img: string;
  description: string;
  price: number;
  categories_name: string;
  quantity: number;
  size: string;
}

const Bestseller: React.FC = () => {
  const [bestselling, setBestselling] = useState<BestsellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedMenuName, setSelectedMenuName] = useState<string>("");

  const reduceMotion = useReducedMotion();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleBuyNowClick = (product: BestsellerProduct, index: number) => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) {
      notification.warning({
        message: "Login required",
        description: "Log in or register to buy items.",
      });
      return;
    }
    setSelectedItem({
      id: product.bestseller_id ?? index + 1,
      item_name: product.item_name,
      menu_img: product.menu_img,
      description: "This is a description",
      price: product.price,
      categories_name: product.categories_name || "",
      quantity: 1,
      size: "Normal size",
    });
    setOrderModalVisible(true);
  };

  const closeOrderModal = () => {
    setOrderModalVisible(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    const storedData = sessionStorage.getItem("bestsellingData");

    if (storedData) {
      setBestselling(JSON.parse(storedData));
      setLoading(false);
      return;
    }

    axios
      .get<BestsellerProduct[]>(`${apiUrl}/bestselling`)
      .then((response) => {
        setBestselling(response.data);
        sessionStorage.setItem(
          "bestsellingData",
          JSON.stringify(response.data),
        );
      })
      .catch((error) => {
        console.error("Error fetching bestseller data:", error);
      })
      .finally(() => setLoading(false));
  }, [apiUrl]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const getImageSrc = (img: string) =>
    img
      ? img.startsWith("http")
        ? img
        : `${apiUrl}/uploads/images/${img}`
      : "https://via.placeholder.com/400?text=No+Image";

  return (
    <section className="container mx-auto px-4 py-14 sm:px-6">
      {/* Heading */}
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="font-core text-3xl  font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Our bestsellers
        </h1>
        <p className="font-core mt-3 text-base text-stone-500">
          The dishes our customers rate highest and order again and again.
        </p>
      </header>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[28px] bg-white p-3 shadow-[0_10px_40px_-12px_rgba(120,70,20,0.18)] ring-1 ring-orange-100"
            >
              <div className="aspect-square w-full rounded-3xl bg-orange-50" />
              <div className="space-y-3 px-2 pb-2 pt-5">
                <div className="h-5 w-3/4 rounded-full bg-stone-100" />
                <div className="h-4 w-1/2 rounded-full bg-stone-100" />
                <div className="h-10 w-full rounded-full bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product grid */}
      {!loading && bestselling.length > 0 && (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {bestselling.map((product, index) => {
            const rating = Number(product.total_avg_rating) || 0;
            const isAvailable =
              (product.availability ?? "available").trim().toLowerCase() ===
              "available";

            return (
              <motion.article
                key={product.item_name + product.menu_img}
                variants={cardVariants}
                className="flex flex-col rounded-[28px] bg-white p-3 shadow-[0_10px_40px_-12px_rgba(120,70,20,0.18)] ring-1 ring-orange-100"
              >
                {/* Image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-orange-50">
                  <img
                    src={getImageSrc(product.menu_img)}
                    alt={product.item_name}
                    loading="lazy"
                    className={`h-full w-full object-cover ${
                      isAvailable ? "" : "grayscale"
                    }`}
                  />

                  {/* soft bottom fade so badges stay readable */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24  " />

                  {index < 3 && isAvailable && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-orange-600 shadow-md backdrop-blur">
                      <FaFire className="text-[11px]" />
                      Top {index + 1}
                    </span>
                  )}

                  {product.categories_name && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                      {product.categories_name}
                    </span>
                  )}

                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-900/45">
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-lg">
                        Not available today
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                  <h3 className="font-core line-clamp-2 text-lg font-bold leading-snug text-stone-900">
                    {product.item_name}
                  </h3>

                  <button
                    type="button"
                    disabled={product.rating_count === 0}
                    onClick={() => {
                      setSelectedMenuName(product.item_name);
                      setReviewsModalVisible(true);
                    }}
                    className="mt-2 flex items-center gap-2 self-start rounded-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 disabled:cursor-default"
                    aria-label={`${product.item_name} rated ${rating.toFixed(
                      1,
                    )} out of 5 from ${product.rating_count} reviews`}
                  >
                    <CustomRate value={rating} />
                    <span className="text-sm font-semibold text-stone-800">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-4">
                      {product.rating_count}{" "}
                      {product.rating_count === 1 ? "review" : "reviews"}
                    </span>
                  </button>

                  {/* Price + actions */}
                  <div className="mt-auto pt-5">
                    <div className="font-core mb-4 flex items-baseline justify-between border-t border-dashed border-orange-200 pt-4">
                      <span className="text-sm text-stone-500">Price</span>
                      <span className="font-core text-2xl font-extrabold text-stone-900">
                        ₱{Number(product.price).toLocaleString()}
                      </span>
                    </div>

                    {isAvailable ? (
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          onClick={() => handleBuyNowClick(product, index)}
                          className="font-core flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-3 py-2.5 text-sm font-semibold text-orange-600 outline-none focus-visible:ring-4 focus-visible:ring-orange-300/40 active:scale-[0.98]   hover:bg-orange-500 hover:text-white transition whitespace-nowrap"
                          whileHover={{ scale: 1.0 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Buy now
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.0 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            addToCart({
                              ...product,
                              categories_name: product.categories_name || null,
                            })
                          }
                          className="font-core flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-3 py-2.5 text-sm font-semibold text-orange-600 outline-none focus-visible:ring-4 focus-visible:ring-orange-300/40 active:scale-[0.98]   hover:bg-orange-500 hover:text-white transition whitespace-nowrap"
                        >
                          <FaShoppingBag className="text-sm" />
                          Add to cart
                        </motion.button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="font-core w-full cursor-not-allowed rounded-full bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-400"
                      >
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && bestselling.length === 0 && (
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[28px] bg-white px-8 py-14 text-center shadow-[0_10px_40px_-12px_rgba(120,70,20,0.18)] ring-1 ring-orange-100">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <FaFire className="text-2xl" />
          </span>
          <p className="font-core text-lg font-bold text-stone-900">
            No bestsellers yet
          </p>
          <p className="font-core mt-1 text-sm text-stone-500">
            Check back soon. Popular items appear here as customers rate them.
          </p>
        </div>
      )}

      {/* Modals */}
      <ClientsCommentsRated
        visible={reviewsModalVisible}
        onCancel={() => setReviewsModalVisible(false)}
        menuName={selectedMenuName}
      />

      {selectedItem && (
        <OrderDetailsModal
          visible={orderModalVisible}
          checkoutItems={[selectedItem]}
          finalTotal={selectedItem.price * (selectedItem.quantity || 1)}
          onCancel={closeOrderModal}
        />
      )}
    </section>
  );
};

export default Bestseller;
