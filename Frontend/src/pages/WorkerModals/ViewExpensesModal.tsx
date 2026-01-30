// components/ViewExpensesModal.tsx
import { Button, Modal } from "antd";
import React from "react";
import dayjs from "dayjs";

interface ExpenseItem {
  expense_date: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  method: string;
  receipt_no: string;
  remarks: string;
}

interface ViewExpensesModalProps {
  isVisible: boolean;
  selectedExpense: ExpenseItem | null;
  onClose: () => void;
}

const ViewExpensesModal: React.FC<ViewExpensesModalProps> = ({
  isVisible,
  selectedExpense,
  onClose,
}) => {
  return (
    <Modal
      title="View Expense Details"
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {selectedExpense ? (
        <div className="space-y-2">
          <p>
            <strong>Date:</strong>{" "}
            {dayjs(selectedExpense.expense_date).format("MMM DD, YYYY")}
          </p>
          <p>
            <strong>Category:</strong> {selectedExpense.category}
          </p>
          <p>
            <strong>Subcategory:</strong> {selectedExpense.subcategory}
          </p>
          <p>
            <strong>Description:</strong> {selectedExpense.description || "—"}
          </p>
          <p>
            <strong>Amount (₱):</strong> ₱{selectedExpense.amount.toFixed(2)}
          </p>
          <p>
            <strong>Method:</strong> {selectedExpense.method}
          </p>
          <p>
            <strong>Receipt No.:</strong> {selectedExpense.receipt_no || "—"}
          </p>
          <p>
            <strong>Remarks:</strong> {selectedExpense.remarks || "—"}
          </p>
        </div>
      ) : (
        <p>No expense selected.</p>
      )}
    </Modal>
  );
};

export default ViewExpensesModal;
