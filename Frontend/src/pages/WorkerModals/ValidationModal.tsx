/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card, Image, Tag, Spin } from "antd";
import dayjs from "dayjs";
import styled from "styled-components";

const StyledPanelContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .transaction-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 20px;
    background: #fff;
    position: relative;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .amount {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .datetime {
    font-size: 13px;
    color: #6b7280;
    text-align: right;
  }

  .details {
    margin-top: 12px;
    font-size: 14px;
    color: #374151;
  }

  .details div {
    margin-bottom: 6px;
  }

  .status-tag {
    position: absolute;
    top: 16px;
    left: 20px;
    font-size: 15px; /* 🔹 Slightly larger font */
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase; /* 🔹 Makes it BIG (PENDING, COMPLETED, PAID) */
    padding: 4px 14px;
    border-radius: 8px;
  }

  .proof-image {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #f0f0f0;
    text-align: center;
  }
`;

interface ValidationModalProps {
  order: any;
}

const apiUrl = import.meta.env.VITE_API_URL;

const ValidationModal: React.FC<ValidationModalProps> = ({ order }) => {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!order?.order_id) return;

    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${apiUrl}/get_transac_validation/${order.order_id}`
        );
        const data = await res.json();

        if (res.ok && data.length > 0) {
          setTransaction(data[0]);
        } else {
          setTransaction(null);
        }
      } catch (err) {
        console.error("Error fetching transaction:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [order]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <p className="text-center text-gray-500">No transaction details found.</p>
    );
  }

  const formattedDate = transaction.payment_date
    ? dayjs(transaction.payment_date).format("DD/MM/YYYY")
    : "";
  const formattedTime = transaction.payment_time
    ? dayjs(transaction.payment_time, "HH:mm:ss").format("h:mm A")
    : "";

  return (
    <Card title="Validate GCash Payment" className="w-full">
      <StyledPanelContent>
        <Card bordered={false} className="transaction-card">
          {/* ✅ BIG status text */}
          <Tag
            className="status-tag"
            color={
              transaction.status.toLowerCase() === "completed"
                ? "green"
                : transaction.status.toLowerCase() === "pending"
                ? "orange"
                : "red"
            }
          >
            {transaction.status.toUpperCase()} {/* 🔹 Forces big text */}
          </Tag>

          {/* Amount + DateTime */}
          <div className="header">
            <div className="amount">₱{transaction.amount}</div>
            <div className="datetime">
              {formattedDate}
              <br />
              {formattedTime}
            </div>
          </div>

          {/* Details */}
          <div className="details">
            <div>Reference Code: {transaction.reference_code}</div>
            <div>GCash Number: {transaction.gcash_number}</div>
          </div>
        </Card>

        {/* Proof of Payment */}
        {transaction.proof_image && (
          <Card
            bordered={false}
            className="proof-image"
            title="Proof of Payment"
          >
            <Image
              src={
                transaction.proof_image
                  ? transaction.proof_image.startsWith("http")
                    ? transaction.proof_image // Cloudinary URL
                    : `${apiUrl}/uploads/images/${transaction.proof_image}` // fallback to backend path
                  : "https://via.placeholder.com/150?text=No+Image" // final placeholder
              }
              alt="Proof of payment"
              style={{
                borderRadius: 8,
                width: "180px", // ✅ smaller image size
                height: "auto",
                objectFit: "contain",
                display: "inline-block", // ✅ keeps it centered horizontally
              }}
              preview={{ mask: "Click to Preview" }}
            />
          </Card>
        )}
      </StyledPanelContent>
    </Card>
  );
};

export default ValidationModal;
