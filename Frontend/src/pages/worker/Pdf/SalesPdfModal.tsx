import React from "react";
import { Button, Modal } from "antd";
import SalesOverviewPDF from "./SalesOverviewPDF";

interface SalesPdfModalProps {
  isVisible: boolean;
  onClose: () => void;
  summary: any;
  dates: [any, any];
}

const SalesPdfModal: React.FC<SalesPdfModalProps> = ({
  isVisible,
  onClose,
  summary,
  dates,
}) => {
  const handlePrintPdf = async () => {
    try {
      const pdfElement = document.createElement("div");
      document.body.appendChild(pdfElement);

      const { createRoot } = await import("react-dom/client");
      const root = createRoot(pdfElement);
      root.render(
        <SalesOverviewPDF
          totalSales={summary.total_sales}
          totalCost={summary.total_cost}
          grossProfit={summary.gross_profit}
          profitMargin={summary.profit_margin}
          aov={summary.average_order_value}
          totalOrders={summary.total_orders}
          reportDate={`${dates[0]?.format("YYYY-MM-DD")} to ${dates[1]?.format(
            "YYYY-MM-DD"
          )}`}
          logo="/logo.jpg"
        />
      );

      setTimeout(() => {
        import("html2pdf.js").then((html2pdf) => {
          html2pdf
            .default()
            .set({
              margin: 10,
              filename: `SalesSummary_${dates[0]?.format(
                "YYYYMMDD"
              )}_${dates[1]?.format("YYYYMMDD")}.pdf`,
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
    } catch (error) {
      console.error(error);
      onClose();
    }
  };

  return (
    <Modal
      title="Sales PDF Preview"
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
        >
          Print PDF
        </Button>,
      ]}
      width={600} // smaller modal
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }} // scroll if content too tall
    >
      <div id="pdf-preview">
        <SalesOverviewPDF
          totalSales={summary.total_sales}
          totalCost={summary.total_cost}
          grossProfit={summary.gross_profit}
          profitMargin={summary.profit_margin}
          aov={summary.average_order_value}
          totalOrders={summary.total_orders}
          reportDate={`${dates[0]?.format("YYYY-MM-DD")} to ${dates[1]?.format(
            "YYYY-MM-DD"
          )}`}
          logo="/logo.jpg"
        />
      </div>
    </Modal>
  );
};

export default SalesPdfModal;
