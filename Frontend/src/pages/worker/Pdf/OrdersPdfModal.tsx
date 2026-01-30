import React, { useEffect, useState } from "react";
import { Button, Modal, Spin } from "antd";
import OrdersOverviewPDF from "./OrdersOverviewPDF";
import axios from "axios";

interface OrdersPdfModalProps {
  isVisible: boolean;
  onClose: () => void;
  order: any; // order object with order_id and user_id
}

interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
  final_total: number;
}

interface Transaction {
  payment_method: string;
  status: string;
}

const OrdersPdfModal: React.FC<OrdersPdfModalProps> = ({
  isVisible,
  onClose,
  order,
}) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [transaction, setTransaction] = useState<Transaction>({
    payment_method: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order) return;
    setLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL;

    // Fetch order items
    const fetchItems = axios.get(
      `${apiUrl}/fetch_order_items/${order.order_id}`
    );
    // Fetch transaction info for the user
    const fetchTransaction = axios.get(
      `${apiUrl}/fetch_transaction/${order.user_id}`
    );

    Promise.all([fetchItems, fetchTransaction])
      .then(([itemsRes, transactionRes]) => {
        const fetchedItems: OrderItem[] = (itemsRes.data.orderItems || []).map(
          (item: any) => ({
            item_name: item.item_name || "Item",
            quantity: Number(item.order_quantity) || 0,
            price: Number(item.price) || 0,
            final_total: Number(item.final_total) || 0,
          })
        );
        setItems(fetchedItems);

        const lastTransaction = transactionRes.data.transactions?.[0] || {};
        setTransaction({
          payment_method: lastTransaction.payment_method || "Walk-in",
          status: lastTransaction.status || "Pending",
        });
      })
      .catch((err) => {
        console.error("Error fetching order or transaction:", err);
        setItems([]);
        setTransaction({ payment_method: "Walk-in", status: "Pending" });
      })
      .finally(() => setLoading(false));
  }, [order]);

  const totalAmount = items.reduce((sum, item) => sum + item.final_total, 0);

  const handlePrintPdf = async () => {
    if (!order) return;

    const pdfElement = document.createElement("div");
    document.body.appendChild(pdfElement);

    const { createRoot } = await import("react-dom/client");
    const root = createRoot(pdfElement);

    root.render(
      <OrdersOverviewPDF
        orderId={order.order_id}
        orderDate={
          order.order_date ? new Date(order.order_date).toLocaleString() : ""
        }
        customerName={
          order.fname && order.lname
            ? `${order.fname} ${order.lname}`
            : "Walk-in"
        }
        totalAmount={totalAmount}
        paymentMethod={transaction.payment_method}
        status={transaction.status}
        items={items}
        logo="/logo.jpg"
      />
    );

    setTimeout(() => {
      import("html2pdf.js").then((html2pdf) => {
        html2pdf
          .default()
          .set({
            margin: 10,
            filename: `Order_${order.order_id}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(pdfElement)
          .save()
          .finally(() => {
            root.unmount();
            document.body.removeChild(pdfElement);
            onClose();
          });
      });
    }, 300);
  };

  return (
    <Modal
      title="Order Receipt Preview"
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="print"
          type="primary"
          className="bg-red-500 hover:bg-red-600 text-white"
          onClick={handlePrintPdf}
          disabled={loading}
        >
          Print PDF
        </Button>,
      ]}
      width={600}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : (
        <OrdersOverviewPDF
          orderId={order.order_id}
          orderDate={
            order.order_date ? new Date(order.order_date).toLocaleString() : ""
          }
          customerName={
            order.fname && order.lname
              ? `${order.fname} ${order.lname}`
              : "Walk-in"
          }
          totalAmount={totalAmount}
          paymentMethod={transaction.payment_method}
          status={transaction.status}
          items={items}
          logo="/logo.jpg"
        />
      )}
    </Modal>
  );
};

export default OrdersPdfModal;
