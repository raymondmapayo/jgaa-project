import React, { useState, useEffect } from "react";
import { Button, Card, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import styled from "styled-components";
import axios from "axios";
import SalesSummaryFilterModal from "../WorkerModals/SalesSummaryFilterModal";
import SalesPdfModal from "./Pdf/SalesPdfModal";

// ====================== Styled Components ======================
const StyledContainer = styled.div`
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease;
  margin: 0 auto;
  box-sizing: border-box;

  .dark & {
    background-color: #001f3f;
    color: white;
  }

  @media (max-width: 1024px) {
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
    padding: 16px;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    padding: 12px;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px !important;
  padding: 20px !important;
  background: #ffffffcc !important;
  backdrop-filter: blur(6px);

  .dark & {
    background: #0b2a4a !important;
  }
`;

// ===============================================================
const WorkerManageSalesSummary: React.FC = () => {
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_sales: 0,
    total_expenses: 0,
    supply_cost: 0,
    total_cost: 0,
    supplyDrinksCost: 0,
    gross_profit: 0,
    profit_margin: 0,
    total_orders: 0,
    average_order_value: 0,
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  // Inside your component
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  // ================== Fetch summary ==================
  const fetchFinancialSummary = async (start: string, end: string) => {
    try {
      setLoading(true); // show loader immediately
      const response = await axios.get(`${apiUrl}/financial_summary`, {
        params: { start, end },
      });

      setSummary(response.data);

      // optional small delay to make loader noticeable
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      message.error("Failed to fetch financial summary.");
    } finally {
      setLoading(false); // hide loader
    }
  };

  const handleExportPDF = () => {
    if (!dates[0] || !dates[1]) return;
    setPdfModalVisible(true);
  };

  const handleResetDates = () => {
    const start = dayjs().startOf("month");
    const end = dayjs();

    setDates([start, end]);
    fetchFinancialSummary(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  };

  // ================== Initial Fetch for Current Month ==================
  useEffect(() => {
    if (dates[0] && dates[1]) {
      const start = dates[0].format("YYYY-MM-DD");
      const end = dates[1].format("YYYY-MM-DD");
      fetchFinancialSummary(start, end);
    }
  }, []); // only once on mount

  // ================== On Apply Click in Modal ==================
  const handleApplyDates = (start: Dayjs | null, end: Dayjs | null) => {
    if (start && end) {
      // close modal first if you want the animation visible
      setDates([start, end]);
      fetchFinancialSummary(
        start.format("YYYY-MM-DD"),
        end.format("YYYY-MM-DD")
      );
    }
  };

  return (
    <StyledContainer>
      <div className="mb-6">
        {/* ===== ROW 1: Title + Filter + Reset ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          {/* Left: Title */}
          <h2 className="text-xl font-bold">Financial Sales Summary</h2>

          {/* Right: Filter + Reset */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <SalesSummaryFilterModal
                dates={dates}
                setDates={handleApplyDates}
              />
            </div>
            <Button className="w-full sm:w-auto" onClick={handleResetDates}>
              Reset
            </Button>
          </div>
        </div>

        {/* ===== ROW 2: Subtitle + Export PDF ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-gray-500 dark:text-gray-300 text-sm">
            Overview of your financial performance
          </p>

          <Button
            icon={<FilePdfOutlined />}
            className="bg-red-500 text-white hover:bg-red-600 shadow-md rounded-md h-11 px-6 w-full sm:w-auto"
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <StyledCard className="mt-4 w-full shadow-md">
        <div className="flex flex-col w-full min-h-[300px] justify-center">
          {loading ? (
            <div className="flex justify-center items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#fa8c16] animate-bounce" />
              <div className="w-4 h-4 rounded-full bg-[#ffc069] animate-bounce [animation-delay:-0.2s]" />
              <div className="w-4 h-4 rounded-full bg-[#C3EBFA] animate-bounce [animation-delay:-0.4s]" />
            </div>
          ) : Object.values(summary).every((v) => v === 0) ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium text-center">
              No sales summary data available yet.
            </p>
          ) : (
            <>
              {/* Header */}
              <div className="border-l-4 border-orange-500 dark:border-orange-400 pl-4 mb-7">
                <h3 className="text-lg font-semibold">Sales Overview</h3>
                <p className="text-gray-500 dark:text-gray-300 text-sm">
                  Summary of financial performance for the selected date range
                </p>
              </div>

              {/* Summary Items */}
              <div className="flex flex-col w-full">
                <SummaryItem
                  label="Total Sales"
                  value={`₱${summary.total_sales.toLocaleString()}`}
                  color="text-orange-600"
                />
                <SummaryItem
                  label="Total Cost (COGS)"
                  value={`₱${summary.total_cost.toLocaleString()}`}
                  color="text-red-500"
                />
                <SummaryItem
                  label="Gross Profit"
                  value={`₱${summary.gross_profit.toLocaleString()}`}
                  color="text-green-600"
                />
                <SummaryItem
                  label="Profit Margin"
                  value={`${summary.profit_margin.toFixed(2)}%`}
                  color="text-blue-600"
                />
                <SummaryItem
                  label="Average Order Value (AOV)"
                  value={`₱${summary.average_order_value.toFixed(2)}`}
                  color="text-purple-600"
                />
                <SummaryItem
                  label="Total Orders"
                  value={`${summary.total_orders.toLocaleString()}`}
                  color="text-gray-800 dark:text-white"
                />
              </div>
            </>
          )}
        </div>

        {/* PDF Modal */}
        <SalesPdfModal
          isVisible={pdfModalVisible}
          onClose={() => setPdfModalVisible(false)}
          summary={summary}
          dates={dates}
        />
      </StyledCard>
    </StyledContainer>
  );
};

// ====================== Summary Row Component ======================
const SummaryItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <>
    <div className="flex justify-between py-4">
      <span className="font-medium text-gray-700 dark:text-gray-200 text-base">
        {label}
      </span>
      <span className={`font-bold ${color} text-lg`}>{value}</span>
    </div>
    <div className="border-b border-gray-200 dark:border-gray-600"></div>
  </>
);

export default WorkerManageSalesSummary;
