import React from "react";

const ReceiptUI: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-lg p-6 border border-gray-300 rounded-lg">
      {/* Title */}
      <h1 className="text-center text-2xl font-bold">Jgaa Restaurant</h1>
      <p className="text-center text-gray-600 text-sm -mt-1 mb-3">
        Finest Quality Cuisine
      </p>

      {/* Logo */}
      <div className="flex justify-center my-4">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
          LOGO
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-400 my-2" />

      {/* Official Receipt */}
      <h2 className="text-center font-semibold tracking-wide">
        OFFICIAL RECEIPT
      </h2>

      <hr className="border-gray-400 my-2" />

      {/* Receipt Details */}
      <div className="text-sm space-y-1">
        <p>
          <span className="font-semibold">Receipt No:</span> RCT-000123
        </p>
        <p>
          <span className="font-semibold">Date:</span> 2025-03-10
        </p>
        <p>
          <span className="font-semibold">Time:</span> 12:45 PM
        </p>
        <p>
          <span className="font-semibold">Cashier:</span> Juan Dela Cruz
        </p>
        <p>
          <span className="font-semibold">Customer:</span> Walk-in
        </p>
      </div>

      <hr className="border-gray-400 my-3" />

      {/* Items Table */}
      <h3 className="font-bold text-sm mb-2">ITEMS</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-400">
            <th className="text-left pb-1">Item</th>
            <th className="text-center pb-1">Qty</th>
            <th className="text-center pb-1">Price</th>
            <th className="text-right pb-1">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pancit</td>
            <td className="text-center">2</td>
            <td className="text-center">150.00</td>
            <td className="text-right">300.00</td>
          </tr>
          <tr>
            <td>Sisig</td>
            <td className="text-center">1</td>
            <td className="text-center">200.00</td>
            <td className="text-right">200.00</td>
          </tr>
          <tr>
            <td>Coke</td>
            <td className="text-center">3</td>
            <td className="text-center">35.00</td>
            <td className="text-right">105.00</td>
          </tr>
        </tbody>
      </table>

      <hr className="border-gray-400 my-3" />

      {/* Totals */}
      <div className="text-sm space-y-1">
        <p className="flex justify-between">
          <span>Subtotal:</span> <span>₱605.00</span>
        </p>
        <p className="flex justify-between">
          <span>VAT (12%):</span> <span>₱72.60</span>
        </p>
        <p className="flex justify-between font-bold">
          <span>Total Amount:</span> <span>₱677.60</span>
        </p>
      </div>

      <hr className="border-gray-400 my-3" />

      {/* Summary Overview */}
      <h3 className="font-bold text-sm mb-2">SUMMARY OVERVIEW</h3>

      <div className="text-sm space-y-1">
        <p className="flex justify-between">
          <span>Total Sales:</span> <span>₱10,250</span>
        </p>
        <p className="flex justify-between">
          <span>Total Cost (COGS):</span> <span>₱7,299</span>
        </p>
        <p className="flex justify-between">
          <span>Gross Profit:</span> <span>₱2,951</span>
        </p>
        <p className="flex justify-between">
          <span>Profit Margin:</span> <span>28.79%</span>
        </p>
        <p className="flex justify-between">
          <span>Average Order Value (AOV):</span> <span>₱931.82</span>
        </p>
        <p className="flex justify-between">
          <span>Total Orders:</span> <span>11</span>
        </p>
      </div>

      <hr className="border-gray-400 my-3" />

      {/* Footer */}
      <p className="text-center text-xs text-gray-600">
        Thank you for dining with Jgaa Restaurant! <br />
        Please come again soon.
      </p>
    </div>
  );
};

export default ReceiptUI;
