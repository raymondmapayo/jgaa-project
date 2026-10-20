/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from "antd";
import { motion, useReducedMotion } from "framer-motion";

interface OrderDetailsModalProps {
  isVisible: boolean;
  order: any;
  orderItems: any[];
  onClose: () => void;
  formatDateWithTime: (dateString: string) => string;
  calculateTotal: () => number;
}

const apiUrl = import.meta.env.VITE_API_URL;

// Picks soft colors for a status label (works for any status text)
const getStatusStyle = (status?: string) => {
  const s = (status ?? "").toLowerCase();

  if (["paid", "completed", "complete", "delivered", "done"].includes(s)) {
    return {
      chip: "bg-green-50 text-green-700 ring-green-200",
      dot: "bg-green-500",
    };
  }
  if (["cancelled", "canceled", "failed", "rejected"].includes(s)) {
    return { chip: "bg-red-50 text-red-600 ring-red-200", dot: "bg-red-500" };
  }
  if (["pending", "processing", "preparing", "unpaid"].includes(s)) {
    return {
      chip: "bg-yellow-50 text-yellow-700 ring-yellow-200",
      dot: "bg-yellow-500",
    };
  }
  return { chip: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" };
};

const capitalize = (text?: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

const StatusChip = ({ label }: { label?: string }) => {
  if (!label) return null;
  const style = getStatusStyle(label);
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${style.chip}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {capitalize(label)}
    </span>
  );
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isVisible,
  order,
  orderItems,
  onClose,
  formatDateWithTime,
  calculateTotal,
}) => {
  const reduceMotion = useReducedMotion();

  if (!order) return null;

  const [datePart, ...timeParts] = formatDateWithTime(order.order_date).split(
    " ",
  );
  const totalQty = orderItems.reduce(
    (sum: number, item: any) => sum + (Number(item.order_quantity) || 0),
    0,
  );

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      styles={{
        content: { padding: 0, borderRadius: 28, overflow: "hidden" },
        body: { padding: 0 },
      }}
    >
      {/* ================= Header ================= */}
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe,transparent_50%)] bg-white px-6 pb-6 pt-7 sm:px-8">
        {/* soft decorative rings */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-blue-200/70" />
        <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full border border-blue-200/70" />

        <p className="m-0 mb-4 text-xs font-semibold tracking-wide text-blue-600">
          Order details
        </p>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={
                order.profile_pic
                  ? order.profile_pic.startsWith("http")
                    ? order.profile_pic
                    : `${apiUrl}/uploads/images/${order.profile_pic}`
                  : "/avatar.jpg"
              }
              alt="Customer"
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover shadow-lg ring-4 ring-white"
            />
            <div>
              <div className="mb-1 inline-block rounded-lg bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                ORD{order.order_id}
              </div>
              <div className="text-xl font-extrabold leading-tight text-gray-900">
                {order.fname} {order.lname}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusChip label={order.payment_status} />
            <StatusChip label={order.order_status} />
          </div>
        </div>
      </div>

      {/* ================= Body ================= */}
      <div className="flex flex-col gap-5 bg-white px-6 pb-6 pt-5 sm:px-8">
        {/* Quick facts */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="m-0 text-xs font-medium text-gray-500">Order date</p>
            <p className="m-0 mt-1 text-sm font-bold text-gray-900">
              {datePart}
            </p>
            <p className="m-0 text-xs text-gray-400">{timeParts.join(" ")}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="m-0 text-xs font-medium text-gray-500">Items</p>
            <p className="m-0 mt-1 text-sm font-bold text-gray-900">
              {orderItems.length}{" "}
              {orderItems.length === 1 ? "product" : "products"}
            </p>
            <p className="m-0 text-xs text-gray-400">{totalQty} pcs in total</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="m-0 text-xs font-medium text-gray-500">Payment</p>
            <p className="m-0 mt-1 text-sm font-bold text-gray-900">
              {capitalize(order.payment_status) || "-"}
            </p>
            <p className="m-0 text-xs text-gray-400">Order #{order.order_id}</p>
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className="m-0 mb-3 text-base font-bold text-gray-900">
            Order products
          </h3>

          {orderItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
              No products found for this order.
            </div>
          ) : (
            <motion.div
              className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {orderItems.map((product: any, index: number) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <img
                    src={
                      product.menu_img
                        ? product.menu_img.startsWith("http")
                          ? product.menu_img
                          : `${apiUrl}/uploads/images/${product.menu_img}`
                        : "https://via.placeholder.com/64?text=No+Image"
                    }
                    alt={product.item_name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://via.placeholder.com/64?text=No+Image";
                    }}
                    className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gray-100 object-cover shadow-sm"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-gray-900 sm:text-base">
                      {product.item_name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {product.size && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                          {product.size}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        ₱{product.price} each
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-semibold text-gray-500">
                      x{product.order_quantity}
                    </div>
                    {product.final_total !== undefined && (
                      <div className="text-sm font-extrabold text-gray-900 sm:text-base">
                        ₱{Number(product.final_total).toFixed(2)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Total */}
        <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-100 px-5 py-4">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border border-green-300/60" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="m-0 text-sm font-semibold text-green-800">
                Total amount
              </p>
              <p className="m-0 text-xs text-green-700/80">
                {orderItems.length}{" "}
                {orderItems.length === 1 ? "product" : "products"} · {totalQty}{" "}
                pcs
              </p>
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-green-600">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;
