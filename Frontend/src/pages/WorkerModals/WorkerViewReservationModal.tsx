import { Button, Form, Input, Modal, Tabs, Tag } from "antd";
import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import styled from "styled-components";
const WorkerViewReservationModal = ({
  visible,
  reservation,
  client,
  apiUrl,
  onClose,
}: any) => {
  const [emailContent, setEmailContent] = useState({ body: "" });

  const formatDate = (date: string) =>
    new Date(date).toISOString().split("T")[0];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hours);
    d.setMinutes(minutes);
    return d.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const formatDateTime = (date: string, time: string) =>
    `${formatDate(date)} ${formatTime(time)}`;

  const handleSendEmail = () => {
    if (!reservation) return;
    const emailData = {
      user_id: reservation.user_id,
      email: reservation.email,
      full_name: reservation.full_name,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      table: reservation.table, // make sure table is passed
      body: emailContent.body, // ✅ this will be used in the email
    };

    axios
      .post(`${apiUrl}/send_reservation_email`, emailData)
      .then(() => {
        Swal.fire("Sent!", "Email sent successfully.", "success");
        setEmailContent({ body: "" });
      })
      .catch(() => Swal.fire("Error", "Failed to send email.", "error"));
  };
  const StyledModalContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .customer-name {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }

    .customer-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      border-radius: 10px;
      background: #f9fafb;
    }

    .meta-item span:first-child {
      font-weight: 500;
      color: #6b7280;
      font-size: 13px;
    }

    .meta-item span:last-child {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
    }

    @media (max-width: 640px) {
      .customer-meta {
        grid-template-columns: 1fr;
      }
    }
  `;

  const tabItems = [
    {
      key: "1",
      label: "Customer Details",
      children: reservation && (
        <StyledModalContent>
          <div className="header">
            <div className="customer-name">{reservation.full_name}</div>
            <div className="flex gap-2">
              <Tag color="blue">{reservation.payment_status || "Pending"}</Tag>
              <Tag color="green">{reservation.order_status || "Active"}</Tag>
            </div>
          </div>

          <div className="customer-meta">
            <div className="meta-item">
              <span>Contact</span>
              <span>{reservation.pnum}</span>
            </div>
            <div className="meta-item">
              <span>Email</span>
              <span>{reservation.email}</span>
            </div>
            <div className="meta-item">
              <span>Address</span>
              <span>{client?.address || "N/A"}</span>
            </div>
            <div className="meta-item">
              <span>Reservation Time</span>
              <span>
                {formatDateTime(
                  reservation.reservation_date,
                  reservation.reservation_time,
                )}
              </span>
            </div>
            <div className="meta-item">
              <span>Special Requests</span>
              <span>{reservation.special_request || "None"}</span>
            </div>
          </div>
        </StyledModalContent>
      ),
    },
    {
      key: "2",
      label: "Compose Email",
      children: reservation && (
        <Form layout="vertical" style={{ padding: 16 }}>
          <Form.Item label="Email">
            <Input value={reservation.email} disabled />
          </Form.Item>
          <Form.Item label="Message">
            <Input.TextArea
              rows={4}
              value={emailContent.body}
              onChange={(e) =>
                setEmailContent({ ...emailContent, body: e.target.value })
              }
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              onClick={handleSendEmail}
              disabled={!emailContent.body.trim()}
            >
              Send Email
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Modal
      title="Reservation Details"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={700}
    >
      {reservation && <Tabs defaultActiveKey="1" items={tabItems} />}
    </Modal>
  );
};

export default WorkerViewReservationModal;
