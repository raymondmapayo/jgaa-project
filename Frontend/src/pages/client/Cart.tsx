import { Checkbox, message, notification, Spin } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaSearch, FaTrashAlt } from "react-icons/fa";
import ConfirmationModal from "../../clientsmodal/ConfirmationModal";
import OrderDetailsModal from "../../clientsmodal/OrderDetailsModal";

import BillingDetailsModal from "../../animation/BillingDetailsModal";
import useStore from "../../zustand/store/store";
import {
  decrementCartItem,
  deleteCartItem,
  incrementCartItem,
} from "../../zustand/store/store.provider";

const Cart = () => {
  const client = useStore((state) => state.client) || {};
  const cart = client.cart || [];
  const [selectedItemsByCategory, setSelectedItemsByCategory] = useState<{
    [key: string]: number[];
  }>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false); // Confirmation Modal visibility
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]); // Items for checkout modal
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false); // Order details modal visibility
  const [isBillingCompleted, setIsBillingCompleted] = useState(true); // Check if billing details are complete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localFinalTotal, setLocalFinalTotal] = useState(0); // add at the top of your component
  // State to control the visibility of BillingDetailsModal
  const [isBillingModalVisible, setBillingModalVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const selectedItemCount = Object.values(selectedItemsByCategory).reduce(
    (sum, ids) => sum + ids.length,
    0
  );

  const finalTotal = cart.reduce((sum, product) => {
    const isSelected = selectedItemsByCategory[
      product.categories_name || "Other"
    ]?.includes(product.id);
    if (isSelected) {
      return sum + product.price * product.quantity;
    }
    return sum;
  }, 0);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timeout);
  }, [selectedItemsByCategory]);

  // Group cart items by category
  const groupedByCategory = cart.reduce((acc, product) => {
    const category = product.categories_name || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as { [key: string]: any[] });

  // Fetch billing data to check if it's complete
  const fetchBillingData = async () => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) return;

    try {
      const response = await axios.get(`${apiUrl}/user_details/${userId}`);
      const user = response.data.data;

      if (!user.city || !user.country) {
        setIsBillingCompleted(false);
      } else {
        setIsBillingCompleted(true);
        // Close the modal after completing the billing details
        setBillingModalVisible(false); // Close the modal
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      message.error("An error occurred while fetching your billing details.");
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleCheckboxChange = (
    category: string,
    productId: number,
    checked: boolean
  ) => {
    setSelectedItemsByCategory((prevSelectedItems) => {
      const updatedSelectedItems = { ...prevSelectedItems };
      if (checked) {
        if (!updatedSelectedItems[category]) {
          updatedSelectedItems[category] = [];
        }
        updatedSelectedItems[category].push(productId);
      } else {
        updatedSelectedItems[category] = updatedSelectedItems[category].filter(
          (id) => id !== productId
        );
      }
      return updatedSelectedItems;
    });
  };

  const handleCheckout = () => {
    // If billing details are incomplete, show error notification and stop checkout
    if (!isBillingCompleted) {
      notification.error({
        message: "Billing Incomplete",
        description:
          "Please complete your billing details (city and country) before proceeding with payment.",
      });

      // Open the modal for billing details
      setBillingModalVisible(true); // Show BillingDetailsModal
      return; // Do not proceed to checkout if billing is incomplete
    }

    const userId = sessionStorage.getItem("user_id");

    if (!userId) {
      console.error("User not logged in");
      return;
    }

    if (selectedItemCount === 0) {
      message.error("Please check the box first before clicking Checkout.");
      return;
    }

    if (finalTotal <= 0) {
      message.error(
        "No items selected or cart is empty. Please add items to your cart."
      );
      return;
    }

    const checkoutData = cart.filter((item) =>
      selectedItemsByCategory[item.categories_name || "Other"]?.includes(
        item.id
      )
    );

    setCheckoutItems(checkoutData);

    // ✅ Calculate and store the local total for the modal
    const localTotal = checkoutData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setLocalFinalTotal(localTotal);

    setIsModalVisible(true); // Show confirmation modal with cart details
  };

  const handleCancel = () => {
    setIsModalVisible(false); // Hide modal if user cancels
  };

  const handleContinue = async () => {
    const userId = sessionStorage.getItem("user_id");
    const selectedItems = cart.filter((item) =>
      selectedItemsByCategory[item.categories_name || "Other"]?.includes(
        item.id
      )
    );

    const data = selectedItems.map((item) => ({
      menu_name: item.item_name,
      quantity: item.quantity,
      availability: "true",
      categories_name: item.categories_name,
      item_name: item.item_name,
      price: item.price,
      menu_img: item.menu_img,
      finalTotal: item.price * item.quantity,
      size: item.size || "Normals ize", // Include the size field (default to "Regular" if not provided)
    }));

    try {
      await axios.post(`${apiUrl}/add_to_cart/${userId}`, {
        items: data,
      });
      setIsModalVisible(false);
      setIsOrderModalVisible(true); // Show order details modal after adding to cart
    } catch (error) {
      message.error("Failed to add items to cart.");
      console.error(error);
    }
  };

  const handleOrderModalClose = () => {
    setIsOrderModalVisible(false); // Close the order details modal
  };

  return (
    <div className="container mx-auto flex flex-col scroll-smooth">
      {Object.keys(groupedByCategory).length > 0 ? (
        <>
          {/* Search Bar */}
          <div className="sticky top-10 md:top-24 z-50 p-6 w-full">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by Category..."
                className="font-core w-full p-3 pl-12 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-red-400 transition text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-4 top-3 sm:top-3.5 text-gray-400 text-lg" />
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col lg:flex-row gap-6">
            {/* Cart Items List */}
            <div className="flex-1 flex flex-col gap-6 w-full pr-2 pb-24 lg:pb-6 lg:ml-8 overflow-y-auto scroll-smooth">
              {Object.keys(groupedByCategory).map((category) => (
                <div
                  key={category}
                  className="bg-white p-4 sm:p-6 rounded-none lg:rounded-2xl shadow-none lg:shadow-lg lg:hover:shadow-xl transition-shadow duration-300 w-full"
                >
                  <h2 className="font-core text-xl sm:text-2xl font-bold mb-4 border-b-2 pb-2 text-gray-800">
                    {category}
                  </h2>
                  {groupedByCategory[category].map((product: any) => (
                    <div
                      key={product.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between py-3 sm:py-4 border-b last:border-none w-full"
                    >
                      {/* Left Section */}
                      <div className="flex items-start md:items-center w-full md:w-auto mb-2 md:mb-0">
                        <Checkbox
                          checked={selectedItemsByCategory[category]?.includes(
                            product.id
                          )}
                          onChange={(e) =>
                            handleCheckboxChange(
                              category,
                              product.id,
                              e.target.checked
                            )
                          }
                          className="mr-3"
                        />
                        <img
                          src={
                            product.menu_img
                              ? product.menu_img.startsWith("http")
                                ? product.menu_img
                                : `${apiUrl}/uploads/images/${product.menu_img}`
                              : "https://via.placeholder.com/80?text=No+Image"
                          }
                          alt={product.item_name}
                          className="w-16 sm:w-20 h-16 sm:h-20 rounded-full shadow-md object-cover"
                        />
                        <div className="ml-3 sm:ml-5 flex-1 min-w-0">
                          <h3 className="font-core text-sm sm:text-md font-semibold text-gray-800 truncate">
                            {product.item_name}{" "}
                            <span className="font-core text-red-500 whitespace-nowrap">
                              ({product.quantity} quantity)
                            </span>
                          </h3>
                          <p className="font-core text-gray-500 text-xs sm:text-sm truncate">
                            Sizes: {product.size || "(Normal size)"}
                          </p>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col md:flex-col-reverse items-end space-y-1 sm:space-y-2 md:space-y-1 w-full md:w-auto mt-2 md:mt-0">
                        <p className="font-core text-sm sm:text-lg font-bold text-red-600">
                          ₱{product.price * product.quantity}
                        </p>
                        <div className="flex space-x-2 sm:space-x-3 mt-1 md:mt-0">
                          <button
                            onClick={() =>
                              decrementCartItem(product.id, product.item_name)
                            }
                            className="font-core px-2 py-1 sm:px-2.5 sm:py-1.5 border rounded text-gray-500 hover:bg-gray-100 text-sm sm:text-base"
                          >
                            -
                          </button>
                          <span className="font-core text-gray-700 text-sm sm:text-base">
                            {product.quantity}
                          </span>
                          <button
                            onClick={() =>
                              incrementCartItem(product.id, product.item_name)
                            }
                            className="font-core px-2 py-1 sm:px-2.5 sm:py-1.5 border rounded text-gray-500 hover:bg-gray-100 text-sm sm:text-base"
                          >
                            +
                          </button>
                          <button
                            disabled={deletingId === product.item_name}
                            onClick={async () => {
                              setDeletingId(product.item_name);
                              await deleteCartItem(product);
                              setDeletingId(null);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm sm:text-base"
                          >
                            {deletingId === product.item_name ? (
                              <Spin size="small" />
                            ) : (
                              <FaTrashAlt />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Final Total Section */}
            <div
              className="bg-white p-4 sm:p-6 rounded-none lg:rounded-2xl shadow-none lg:shadow-lg h-fit flex flex-col gap-3 sm:gap-4
          w-full fixed left-0 right-0 bottom-0 z-50
          lg:w-80 lg:ml-8 lg:sticky lg:top-48 lg:bottom-auto lg:left-auto lg:right-auto"
            >
              <p className="font-core text-base sm:text-xl font-bold flex items-center gap-2">
                Total:
                <Spin spinning={loading} size="small">
                  <span
                    className={`text-red-500 ml-1 ${
                      loading ? "invisible" : "visible"
                    }`}
                  >
                    ₱{finalTotal}
                  </span>
                </Spin>
              </p>
              <button
                onClick={handleCheckout}
                className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold shadow text-sm sm:text-base"
              >
                Checkout ({selectedItemCount})
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full mt-4 sm:mt-8">
          <p className="font-core text-center text-gray-500 text-sm sm:text-base">
            No items in cart
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={isModalVisible}
        onCancel={handleCancel}
        onContinue={handleContinue}
      />

      <OrderDetailsModal
        visible={isOrderModalVisible}
        checkoutItems={checkoutItems}
        finalTotal={localFinalTotal} // use local total instead of live cart total
        onCancel={handleOrderModalClose}
      />

      {/* Billing Details Modal */}
      <BillingDetailsModal
        isVisible={isBillingModalVisible}
        onClose={() => setBillingModalVisible(false)}
        onContinue={fetchBillingData}
      />
    </div>
  );
};

export default Cart;
