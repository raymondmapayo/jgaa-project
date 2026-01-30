import React from "react";

interface SalesOverviewPDFProps {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  aov: number;
  totalOrders: number;
  reportDate: string;
  logo?: string;
}

const SalesOverviewPDF: React.FC<SalesOverviewPDFProps> = ({
  totalSales,
  totalCost,
  grossProfit,
  profitMargin,
  aov,
  totalOrders,
  reportDate,
  logo,
}) => {
  return (
    <div
      id="print-area"
      className="w-full max-w-xl mx-auto bg-white p-6 text-black"
    >
      {/* Restaurant Name */}
      <h1 className="text-2xl font-bold text-center">Jgaa Restaurant</h1>

      {/* Logo */}
      {logo && (
        <div className="flex justify-center my-3">
          <img src={logo} alt="logo" className="w-20 h-20 object-contain" />
        </div>
      )}

      {/* Date */}
      <p className="text-center text-gray-600 mb-4">Date: {reportDate}</p>

      {/* Title */}
      <h2 className="text-xl font-bold text-center">Sales Overview</h2>

      {/* Subtitle */}
      <p className="text-center text-gray-600 mb-6">
        Summary of financial performance for the selected date range
      </p>

      {/* Info Rows */}
      <div className="text-base space-y-3">
        <div className="flex justify-between">
          <span className="font-semibold">Total Sales</span>
          <span>₱{totalSales.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Total Cost (COGS)</span>
          <span>₱{totalCost.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Gross Profit</span>
          <span>₱{grossProfit.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Profit Margin</span>
          <span>{profitMargin.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Average Order Value (AOV)</span>
          <span>₱{aov.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Total Orders</span>
          <span>{totalOrders}</span>
        </div>
      </div>
    </div>
  );
};

export default SalesOverviewPDF;
