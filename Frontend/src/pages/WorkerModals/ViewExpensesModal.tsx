// components/ViewExpensesModal.tsx
import { Button, Modal, Tag, Divider } from "antd";
import React from "react";
import styled from "styled-components";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

// Styled component
const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .category {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
  }

  .description {
    font-size: 14px;
    color: #111827;

    padding: 12px;
    border-radius: 10px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-card {
    background: #f9fafb;
    border-radius: 10px;
    padding: 12px;
  }

  .stat-label {
    font-size: 12px;
    color: #6b7280;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .amount {
    color: #fa8c16;
    font-size: 16px;
  }

  @media (max-width: 640px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
`;

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
  if (!selectedExpense) return null;

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={620}
      centered
      title="Expense Details"
    >
      <StyledModalContent>
        {/* Header: Category / Subcategory + Amount */}
        <div className="header">
          <div className="category">
            {selectedExpense.category} / {selectedExpense.subcategory}
          </div>
          <Tag className="amount">₱{selectedExpense.amount.toFixed(2)}</Tag>
        </div>

        {/* Date Meta */}
        <div className="meta">
          <CalendarOutlined />
          {dayjs(selectedExpense.expense_date).format("MMMM D, YYYY • h:mm A")}
        </div>

        {/* Description below Date */}
        <div className="description">{selectedExpense.description || "—"}</div>

        <Divider />

        {/* Stats grid: Method, Receipt No., Remarks */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Method</div>
            <div className="stat-value">{selectedExpense.method}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Receipt No.</div>
            <div className="stat-value">
              {selectedExpense.receipt_no || "—"}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Remarks</div>
            <div className="stat-value">{selectedExpense.remarks || "—"}</div>
          </div>
        </div>
      </StyledModalContent>
    </Modal>
  );
};

export default ViewExpensesModal;
