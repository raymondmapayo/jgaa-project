import { Checkbox, message, notification, Spin } from "antd";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaMinus, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import ConfirmationModal from "../../clientsmodal/ConfirmationModal";
import OrderDetailsModal from "../../clientsmodal/OrderDetailsModal";
import BillingDetailsModal from "../../animation/BillingDetailsModal";
import useStore from "../../zustand/store/store";
import {
  decrementCartItem,
  deleteCartItem,
  incrementCartItem,
} from "../../zustand/store/store.provider";

const peso = (n: number) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;

const categoryOf = (item: any): string => item.categories_name || "Other";

const Cart = () => {
  const client = useStore((state) => state.client) || {};
  const cart: any[] = client.cart || [];
  const apiUrl = import.meta.env.VITE_API_URL;

  const [selectedItemsByCategory, setSelectedItemsByCategory] = useState<{
    [key: string]: number[];
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [isBillingCompleted, setIsBillingCompleted] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localFinalTotal, setLocalFinalTotal] = useState(0);
  const [isBillingModalVisible, setBillingModalVisible] = useState(false);

  /* ---------- Selection helpers ---------- */

  const isSelected = (item: any) =>
    !!selectedItemsByCategory[categoryOf(item)]?.includes(item.id);

  const selectedItems = useMemo(
    () => cart.filter((item) => isSelected(item)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, selectedItemsByCategory],
  );

  const selectedItemCount = selectedItems.reduce(
    (sum, p) => sum + p.quantity,
    0,
  );
  const finalTotal = selectedItems.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0,
  );

  /* ---------- Search + grouping ---------- */

  const visibleCart = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cart;
    return cart.filter(
      (item) =>
        (item.item_name || "").toLowerCase().includes(q) ||
        categoryOf(item).toLowerCase().includes(q),
    );
  }, [cart, searchTerm]);

  const groupedByCategory = useMemo(
    () =>
      visibleCart.reduce(
        (acc, product) => {
          const category = categoryOf(product);
          if (!acc[category]) acc[category] = [];
          acc[category].push(product);
          return acc;
        },
        {} as { [key: string]: any[] },
      ),
    [visibleCart],
  );

  const allVisibleSelected =
    visibleCart.length > 0 && visibleCart.every((item) => isSelected(item));

  /* ---------- Billing check ---------- */

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
        setBillingModalVisible(false);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      message.error("Couldn't load your billing details. Try again.");
    }
  };

  useEffect(() => {
    fetchBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Handlers ---------- */

  const setSelection = (category: string, ids: number[]) =>
    setSelectedItemsByCategory((prev) => ({ ...prev, [category]: ids }));

  const handleCheckboxChange = (
    category: string,
    productId: number,
    checked: boolean,
  ) => {
    setSelectedItemsByCategory((prev) => {
      const current = prev[category] || [];
      const next = checked
        ? current.includes(productId)
          ? current
          : [...current, productId]
        : current.filter((id) => id !== productId);
      return { ...prev, [category]: next };
    });
  };

  const toggleCategory = (category: string, items: any[], checked: boolean) => {
    const ids = items.map((i: any) => i.id);

    const current = selectedItemsByCategory[category] || [];

    setSelection(
      category,
      checked
        ? Array.from(new Set([...current, ...ids]))
        : current.filter((id) => !ids.includes(id)),
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    Object.entries(groupedByCategory).forEach(([category, items]) => {
      toggleCategory(category, items as any[], checked);
    });
  };

  // Auto-select an item when its quantity goes up
  const handleIncrement = (
    category: string,
    productId: number,
    itemName: string,
  ) => {
    incrementCartItem(productId, itemName);
    handleCheckboxChange(category, productId, true);
  };

  const handleDecrement = (productId: number, itemName: string) => {
    decrementCartItem(productId, itemName);
  };

  const handleCheckout = () => {
    if (!isBillingCompleted) {
      notification.error({
        message: "Add your billing details",
        description: "Enter your city and country before you check out.",
      });
      setBillingModalVisible(true);
      return;
    }

    const userId = sessionStorage.getItem("user_id");
    if (!userId) return;

    if (selectedItemCount === 0 || finalTotal <= 0) {
      message.warning("Select at least one item to check out.");
      return;
    }

    setCheckoutItems(selectedItems);
    setLocalFinalTotal(
      selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    );
    setIsModalVisible(true);
  };

  const handleCancel = () => setIsModalVisible(false);

  const handleContinue = async () => {
    const userId = sessionStorage.getItem("user_id");

    const data = selectedItems.map((item) => ({
      menu_name: item.item_name,
      quantity: item.quantity,
      availability: "true",
      categories_name: item.categories_name,
      item_name: item.item_name,
      price: item.price,
      menu_img: item.menu_img,
      finalTotal: item.price * item.quantity,
      size: item.size || "Normal size",
    }));

    try {
      await axios.post(`${apiUrl}/add_to_cart/${userId}`, { items: data });
      setSelectedItemsByCategory({});
      setIsModalVisible(false);
      setIsOrderModalVisible(true);
    } catch (error) {
      message.error("Couldn't place your order. Try again.");
      console.error(error);
    }
  };

  const handleOrderModalClose = () => setIsOrderModalVisible(false);

  const imgSrc = (img: string) =>
    img
      ? img.startsWith("http")
        ? img
        : `${apiUrl}/uploads/images/${img}`
      : "https://via.placeholder.com/80?text=No+Image";

  /* ---------- Render ---------- */

  const SummaryBody = ({ compact = false }: { compact?: boolean }) => (
    <>
      {!compact && (
        <>
          <h2 className="text-lg font-semibold text-stone-900">
            Order summary
          </h2>
          <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
            <span>Selected items</span>
            <span className="font-medium text-stone-800">
              {selectedItemCount}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-4">
            <span className="text-sm text-stone-500">Total</span>
            <span className="text-2xl font-bold text-stone-900">
              {peso(finalTotal)}
            </span>
          </div>
        </>
      )}
      {compact && (
        <div className="min-w-0">
          <p className="text-xs text-stone-500">
            Total · {selectedItemCount}{" "}
            {selectedItemCount === 1 ? "item" : "items"}
          </p>
          <p className="text-xl font-bold text-stone-900">{peso(finalTotal)}</p>
        </div>
      )}
      <button
        onClick={handleCheckout}
        className={`rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
          compact ? "" : "mt-5 w-full"
        }`}
      >
        Check out{selectedItemCount > 0 ? ` (${selectedItemCount})` : ""}
      </button>
      {!compact && selectedItemCount === 0 && (
        <p className="mt-3 text-center text-xs text-stone-400">
          Tick the items you want to order.
        </p>
      )}
    </>
  );

  return (
    <div className="font-core min-h-screen bg-stone-50">
      <div className="container mx-auto max-w-6xl px-4 pb-32 pt-6 lg:pb-10">
        <h1 className="text-3xl font-bold text-stone-900">Your cart</h1>

        {cart.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-stone-100">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-2xl">
              🛒
            </div>
            <h2 className="text-lg font-semibold text-stone-900">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">
              Add a few dishes and they'll show up here.
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Browse the menu
            </a>
          </div>
        ) : (
          <>
            {/* Search + select all */}
            <div className="sticky top-10 z-30 -mx-4 mt-4 bg-stone-50/95 px-4 py-3 backdrop-blur md:top-24">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your cart by dish or category"
                  aria-label="Search cart"
                  className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Checkbox
                  checked={allVisibleSelected}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                >
                  <span className="text-sm text-stone-700">
                    Select all ({visibleCart.length})
                  </span>
                </Checkbox>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-6 lg:flex-row">
              {/* Items */}
              <div className="flex flex-1 flex-col gap-5">
                {visibleCart.length === 0 && (
                  <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-stone-100">
                    <h2 className="text-lg font-semibold text-stone-900">
                      No matches
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Nothing in your cart matches “{searchTerm}”.
                    </p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-5 rounded-full border border-stone-300 px-6 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                    >
                      Clear search
                    </button>
                  </div>
                )}

                {Object.keys(groupedByCategory).map((category) => {
                  const items = groupedByCategory[category];

                  const selectedHere = items.filter((i: any) =>
                    isSelected(i),
                  ).length;

                  return (
                    <section
                      key={category}
                      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100"
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 sm:px-5">
                        <Checkbox
                          checked={selectedHere === items.length}
                          indeterminate={
                            selectedHere > 0 && selectedHere < items.length
                          }
                          onChange={(e) =>
                            toggleCategory(category, items, e.target.checked)
                          }
                        >
                          <span className="font-semibold text-stone-900">
                            {category}
                          </span>
                        </Checkbox>

                        <span className="text-xs text-stone-400">
                          {items.length} {items.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <ul className="divide-y divide-stone-100">
                        {items.map((product: any) => (
                          <li
                            key={product.id}
                            className={`flex flex-wrap items-center gap-4 px-4 py-4 transition sm:px-5 ${
                              isSelected(product) ? "bg-orange-50/50" : ""
                            }`}
                          >
                            <Checkbox
                              checked={isSelected(product)}
                              onChange={(e) =>
                                handleCheckboxChange(
                                  category,
                                  product.id,
                                  e.target.checked,
                                )
                              }
                              aria-label={`Select ${product.item_name}`}
                            />

                            <img
                              src={imgSrc(product.menu_img)}
                              alt={product.item_name}
                              loading="lazy"
                              className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                            />

                            <div className="min-w-0 flex-1 basis-40">
                              <h3 className="truncate font-semibold text-stone-900">
                                {product.item_name}
                              </h3>

                              <p className="text-sm text-stone-500">
                                {product.size || "Normal size"} ·{" "}
                                {peso(product.price)} each
                              </p>

                              <p className="mt-1 text-base font-bold text-orange-600">
                                {peso(product.price * product.quantity)}
                              </p>
                            </div>

                            <div className="ml-auto flex items-center gap-3">
                              <div className="flex items-center rounded-full border border-stone-200">
                                <button
                                  onClick={() =>
                                    handleDecrement(
                                      product.id,
                                      product.item_name,
                                    )
                                  }
                                  aria-label={`Decrease ${product.item_name}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                                >
                                  <FaMinus className="text-xs" />
                                </button>

                                <span className="w-8 text-center text-sm font-medium text-stone-800">
                                  {product.quantity}
                                </span>

                                <button
                                  onClick={() =>
                                    handleIncrement(
                                      category,
                                      product.id,
                                      product.item_name,
                                    )
                                  }
                                  aria-label={`Increase ${product.item_name}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                                >
                                  <FaPlus className="text-xs" />
                                </button>
                              </div>

                              <button
                                disabled={deletingId === product.item_name}
                                onClick={async () => {
                                  setDeletingId(product.item_name);
                                  await deleteCartItem(product);
                                  setDeletingId(null);
                                }}
                                aria-label={`Remove ${product.item_name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                              >
                                {deletingId === product.item_name ? (
                                  <Spin size="small" />
                                ) : (
                                  <FaTrashAlt />
                                )}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>

              {/* Desktop summary */}
              <aside className="hidden h-fit w-80 shrink-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100 lg:sticky lg:top-48 lg:block">
                <SummaryBody />
              </aside>
            </div>

            {/* Mobile checkout bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-stone-200 bg-white px-4 py-3 lg:hidden">
              <SummaryBody compact />
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        visible={isModalVisible}
        onCancel={handleCancel}
        onContinue={handleContinue}
      />

      <OrderDetailsModal
        visible={isOrderModalVisible}
        checkoutItems={checkoutItems}
        finalTotal={localFinalTotal}
        onCancel={handleOrderModalClose}
      />

      <BillingDetailsModal
        isVisible={isBillingModalVisible}
        onClose={() => setBillingModalVisible(false)}
        onContinue={fetchBillingData}
      />
    </div>
  );
};

export default Cart;
