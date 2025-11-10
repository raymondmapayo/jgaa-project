import { Modal } from "antd";
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaShoppingBag } from "react-icons/fa";
import { CustomRate } from "../../components/client/Rate";
import { addToCart } from "../../zustand/store/store.provider"; // Importing addToCart from zustand store
import ProductInfo from "./ProductInfo";
import ClientsCommentsRated from "../ClientsModal/ClientsCommentsRated";
// Define interface for bestselling product
interface BestsellerProduct {
  bestseller_id?: number; // Optional in case it's not returned
  item_name: string;
  menu_img: string;
  price: number;
  total_avg_rating: string;
  rating_count: number;
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
  size: string; // Optional size property
}

const Bestseller: React.FC = () => {
  const [bestselling, setBestselling] = useState<BestsellerProduct[]>([]); // Use interface
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null); // Selected item for the modal
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  const [selectedMenuName, setSelectedMenuName] = useState<string>("");

  const apiUrl = import.meta.env.VITE_API_URL;
  // Show the modal when a menu item is clicked
  const handleViewMenuClick = (product: BestsellerProduct) => {
    const menuItem: MenuItem = {
      id: 1, // Example ID, replace it with the actual ID logic
      item_name: product.item_name,
      menu_img: product.menu_img,
      description: "This is a description", // Replace with actual description
      price: product.price,
      categories_name: product.categories_name || "",
      quantity: 1, // Set quantity as needed
      size: "Normal size", // Replace with actual size
    };
    setSelectedItem(menuItem);
    setModalVisible(true); // Open modal
  };
  // Close the modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null); // Clear the selected item when modal is closed
  };

  useEffect(() => {
    const storedData = sessionStorage.getItem("bestsellingData");

    if (storedData) {
      setBestselling(JSON.parse(storedData));
    } else {
      axios
        .get<BestsellerProduct[]>(`${apiUrl}/bestselling`)
        .then((response) => {
          console.log("API Response:", response.data);
          setBestselling(response.data);
          sessionStorage.setItem(
            "bestsellingData",
            JSON.stringify(response.data)
          );
        })
        .catch((error) => {
          console.error("Error fetching bestseller data:", error);
          if (error.response) {
            console.error("Response error:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
          } else if (error.request) {
            console.error("Request error:", error.request);
          } else {
            console.error("General error:", error.message);
          }
        });
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.5,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Section Heading */}
      <motion.div
        className="text-center mx-auto mb-12 max-w-3xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="font-core text-4xl font-bold text-gray-800">
          Bestseller Products
        </h1>
        <p className="font-core text-gray-600 mt-4">
          Explore our most popular products based on customer ratings.
        </p>
      </motion.div>

      {/* Grid Layout for Bestseller Products */}
      {bestselling.length > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          {bestselling.map((product) => (
            <motion.div
              key={product.item_name + product.menu_img}
              className="bg-[#fff7ec] cursor-pointer border border-gray-200 rounded-lg shadow-lg overflow-hidden relative p-6 sm:flex sm:flex-row sm:items-center sm:flex-wrap text-center"
              variants={cardVariants}
            >
              {/* Product Image */}
              <div className="relative w-32 h-32 mx-auto mt-4 flex-shrink-0">
                <img
                  src={
                    product.menu_img
                      ? product.menu_img.startsWith("http")
                        ? product.menu_img
                        : `${apiUrl}/uploads/images/${product.menu_img}`
                      : "https://via.placeholder.com/128?text=No+Image"
                  }
                  alt={product.item_name}
                  className="h-32 w-32 object-cover rounded-full border-4 border-orange-500 shadow-lg"
                />
              </div>

              {/* Product Details */}
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1 min-w-0">
                <h5 className="font-core text-lg font-semibold text-gray-800">
                  {product.item_name}
                </h5>

                {/* Rating, Reviews, and Price */}
                <div className="mt-2 text-left">
                  <div className="flex justify-start text-yellow-500">
                    <CustomRate value={parseFloat(product.total_avg_rating)} />
                  </div>
                  <div
                    className="font-core text-gray-600 mt-2 cursor-pointer hover:text-orange-500"
                    onClick={() => {
                      if (product.rating_count > 0) {
                        setSelectedMenuName(product.item_name);
                        setReviewsModalVisible(true);
                      }
                    }}
                  >
                    <p>
                      {product.rating_count > 0
                        ? `${product.rating_count} reviews`
                        : "No reviews yet"}
                    </p>
                  </div>
                  <h4 className="font-core text-xl font-bold text-gray-800 mt-2">
                    ₱{product.price}
                  </h4>
                </div>

                {/* Buttons Section */}
                <div className="mt-4 flex flex-wrap justify-between gap-4">
                  <motion.button
                    className="font-core flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2 text-sm sm:text-sm md:text-base font-semibold text-orange-500 border border-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-300 whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewMenuClick(product)}
                  >
                    View Menu
                  </motion.button>

                  <motion.button
                    className="font-core flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2 text-sm sm:text-sm md:text-base font-semibold text-orange-500 border border-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-300 whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      addToCart({
                        ...product,
                        categories_name: product.categories_name || null,
                      })
                    }
                  >
                    {/* Always visible, scalable icon */}
                    <FaShoppingBag className="text-sm sm:text-base md:text-base" />{" "}
                    Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Reviews Modal */}
          <ClientsCommentsRated
            visible={reviewsModalVisible}
            onCancel={() => setReviewsModalVisible(false)}
            menuName={selectedMenuName}
          />

          {/* Product Info Modal */}
          <Modal
            open={modalVisible}
            onCancel={closeModal}
            footer={null}
            bodyStyle={{ padding: "20px" }}
            width={800}
          >
            {selectedItem && <ProductInfo item={selectedItem} />}
          </Modal>
        </motion.div>
      )}

      {/* Fallback when no products */}
      {bestselling.length === 0 && (
        <div className="col-span-full flex items-center justify-center py-12">
          <p className="font-core text-gray-500 text-base sm:text-lg md:text-xl font-medium text-center">
            No bestseller products available at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default Bestseller;
