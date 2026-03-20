/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Tag, Divider } from "antd";
import styled from "styled-components";

const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .order-id {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .customer {
    font-size: 13px;
    color: #6b7280;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    font-size: 13px;
  }

  .meta-item span:first-child {
    color: #6b7280;
    font-weight: 500;
  }

  .total-card {
    background: #f0fdf4;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .total-label {
    font-size: 14px;
    font-weight: 600;
    color: #166534;
  }

  .total-value {
    font-size: 24px;
    font-weight: 700;
    color: #16a34a;
  }

  .products-title {
    font-size: 16px;
    font-weight: 600;
  }

  .product-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 12px;
  }

  .product-img {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    object-fit: cover;
  }

  .product-name {
    font-weight: 600;
    font-size: 14px;
  }

  .product-meta {
    font-size: 12px;
    color: #6b7280;
  }

  @media (max-width: 640px) {
    .meta {
      grid-template-columns: 1fr;
    }
  }
`;

interface OrderDetailsModalProps {
  isVisible: boolean;
  order: any;
  orderItems: any[];
  onClose: () => void;
  formatDateWithTime: (dateString: string) => string;
  calculateTotal: () => number;
}

const apiUrl = import.meta.env.VITE_API_URL;

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isVisible,
  order,
  orderItems,
  onClose,
  formatDateWithTime,
  calculateTotal,
}) => {
  if (!order) return null;

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={620}
      centered
      title="Order Details"
    >
      <StyledModalContent>
        {/* Header */}
        <div className="header">
          <div>
            <div className="order-id">ORD{order.order_id}</div>
            <div className="customer">
              {order.fname} {order.lname}
            </div>
          </div>

          <div className="flex gap-2">
            <Tag color="blue">{order.payment_status}</Tag>
            <Tag color="green">{order.order_status}</Tag>
          </div>
        </div>

        {/* Meta */}
        <div className="meta">
          <div className="meta-item">
            <span>Order Date</span>
            <div>{formatDateWithTime(order.order_date)}</div>
          </div>
        </div>

        {/* Total */}
        <div className="total-card">
          <span className="total-label">Total Amount</span>
          <span className="total-value">₱{calculateTotal().toFixed(2)}</span>
        </div>

        <Divider />

        {/* Products */}
        <div className="products-title">Products</div>

        <div className="products-grid">
          {orderItems.map((product: any, index: number) => (
            <div key={index} className="product-card">
              <img
                src={
                  product.menu_img
                    ? product.menu_img.startsWith("http")
                      ? product.menu_img
                      : `${apiUrl}/uploads/images/${product.menu_img}`
                    : "https://via.placeholder.com/56?text=No+Image"
                }
                alt={product.item_name}
                className="product-img"
              />

              <div>
                <div className="product-name">{product.item_name}</div>
                <div className="product-meta">
                  Qty: {product.order_quantity} • ₱{product.price}
                </div>
                <div className="product-meta">Size: {product.size}</div>
              </div>
            </div>
          ))}
        </div>
      </StyledModalContent>
    </Modal>
  );
};

export default OrderDetailsModal;
