/* eslint-disable @typescript-eslint/no-explicit-any */
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

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  .category {
    font-size: 12px;
    color: #6b7280;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
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
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .price {
    color: #fa8c16;
  }

  @media (max-width: 640px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
`;

interface ViewInventoryModalProps {
  visible: boolean;
  selectedItem?: any | null;
  onClose: () => void;
}

const ViewInventoryModal: React.FC<ViewInventoryModalProps> = ({
  visible,
  selectedItem,
  onClose,
}) => {
  if (!selectedItem) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={620}
      centered
      title="Inventory Details"
    >
      <StyledModalContent>
        {/* Header */}
        <div className="header">
          <div>
            <div className="title">{selectedItem.product_name}</div>
            <div className="category">{selectedItem.category}</div>
          </div>

          <Tag color={selectedItem.status === "Available" ? "green" : "red"}>
            {selectedItem.status}
          </Tag>
        </div>

        {/* Created At */}
        <div className="meta">
          <CalendarOutlined />
          Added on{" "}
          {dayjs(selectedItem.created_at).format("MMMM D, YYYY • h:mm A")}
        </div>

        <Divider />

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Stock In</div>
            <div className="stat-value">{selectedItem.stock_in}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Unit</div>
            <div className="stat-value">{selectedItem.unit}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Price</div>
            <div className="stat-value price">₱{selectedItem.price}</div>
          </div>
        </div>
      </StyledModalContent>
    </Modal>
  );
};

export default ViewInventoryModal;
