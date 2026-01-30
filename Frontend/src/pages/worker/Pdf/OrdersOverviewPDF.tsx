import React from "react";

interface OrderItem {
  item_name?: string;
  quantity?: number;
  price?: number;
  final_total?: number;
}

interface OrdersOverviewPDFProps {
  orderId?: number;
  orderDate?: string;
  customerName?: string;
  totalAmount?: number;
  paymentMethod?: string;
  status?: string;
  items?: OrderItem[];
  logo?: string;
}

const OrdersOverviewPDF: React.FC<OrdersOverviewPDFProps> = ({
  orderId,
  orderDate,
  customerName,
  totalAmount,
  paymentMethod,
  status,
  items = [],
  logo,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto bg-white p-6 text-black">
      <h1 className="text-2xl font-bold text-center">Jgaa Restaurant</h1>
      {logo && (
        <div className="flex justify-center my-3">
          <img src={logo} alt="logo" className="w-20 h-20 object-contain" />
        </div>
      )}
      <p className="text-center text-gray-600 mb-4">Date: {orderDate}</p>

      <h2 className="text-xl font-bold text-center">Order Overview</h2>
      <p className="text-center text-gray-600 mb-6">
        Summary of this order transaction
      </p>

      <div className="text-base space-y-3">
        <div className="flex justify-between">
          <span className="font-semibold">Order ID</span>
          <span>{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Customer</span>
          <span>{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Payment Method</span>
          <span>{paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Status</span>
          <span>{status}</span>
        </div>
        <div className="flex justify-between border-t pt-3">
          <span className="font-semibold">Total Amount</span>
          <span>₱{(totalAmount ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {items.length > 0 && (
        <>
          <h3 className="text-lg font-bold mt-6 mb-2">Ordered Items</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.item_name} × {item.quantity}
                </span>
                <span>₱{item.final_total?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersOverviewPDF;
