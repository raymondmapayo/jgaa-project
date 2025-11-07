/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Input, Select, Tooltip, message as antdMessage } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Option } = Select;

interface EditValidationModalProps {
  order: any;
  onUpdateOrder?: (updatedOrder: any) => void;
  onClose?: () => void; // ✅ Added onClose prop
}
const apiUrl = import.meta.env.VITE_API_URL;

const EditValidationModal: React.FC<EditValidationModalProps> = ({
  order,
  onUpdateOrder,
  onClose, // ✅ Destructure onClose
}) => {
  const [message, setMessage] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("Pending");
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (order) {
      const formattedStatus =
        order.payment_status?.charAt(0).toUpperCase() +
        order.payment_status?.slice(1).toLowerCase();

      setPaymentStatus(formattedStatus || "Pending");
      setMessage(order.validation_message || "Your GCash payment is verified");

      // ✅ Disable only if the order is already paid
      setIsSaved(formattedStatus === "Paid");
    }
  }, [order]);

  const handleSave = async () => {
    if (paymentStatus === "Pending") {
      antdMessage.warning(
        "Please select 'Paid' before saving. The current status is still Pending."
      );
      return;
    }

    setLoading(true);
    try {
      const workerId = sessionStorage.getItem("user_id");
      if (!workerId) throw new Error("Worker ID not found in session");

      // Send notification to client
      await axios.post(`${apiUrl}/send_client_notification`, {
        message,
        sender_id: workerId,
        recipient_id: order?.user_id,
        status: "unread",
      });

      if (paymentStatus === "Paid") {
        // Update order status & related tables
        const { data } = await axios.put(`${apiUrl}/update_order_status`, {
          order_id: order?.order_id,
          payment_status: "Paid",
          created_by: workerId,
        });

        await axios.put(`${apiUrl}/update_transaction_status`, {
          user_id: order?.user_id,
          status: "Completed",
        });

        await axios.put(`${apiUrl}/update_payment_status`, {
          user_id: order?.user_id,
          payment_status: "Completed",
        });

        await axios.post(`${apiUrl}/update_payment_status/${order.order_id}`, {
          paymentStatus: "paid",
        });

        if (onUpdateOrder && data.updatedOrder) {
          onUpdateOrder(data.updatedOrder);
        }

        antdMessage.success("Payment completed & inventory updated!");
        // ✅ Disable inputs only for this order after successful save
        setIsSaved(true);

        // ✅ Close modal automatically after successful Paid save
        if (onClose) onClose();
      } else {
        antdMessage.success("Validation saved successfully!");
        // Optional: auto-close even for Pending
        if (onClose) onClose();
      }
    } catch (error: any) {
      console.error("Error saving order:", error);
      antdMessage.error(
        error.response?.data?.error || "Failed to save changes."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block font-medium mb-1">Payment Status</label>
        <Select
          value={paymentStatus}
          onChange={(value) => {
            setPaymentStatus(value);
            // ✅ Re-enable Save button if user changes dropdown before saving
            setIsSaved(false);
          }}
          className="w-full"
          disabled={isSaved} // ✅ Only disable after this order is saved as Paid
        >
          <Option value="Pending">Pending</Option>
          <Option value="Paid">Paid</Option>
        </Select>
      </div>

      <div>
        <label className="block font-medium mb-1">Message</label>
        <TextArea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a note or message..."
          disabled={isSaved} // ✅ Only disable after this order is saved as Paid
        />
      </div>

      <div className="flex justify-end gap-2">
        <Tooltip
          title={isSaved ? "Changes have been saved" : "Save your changes"}
        >
          <Button
            type="primary"
            loading={loading}
            onClick={handleSave}
            disabled={isSaved} // ✅ Only disable after this order is saved as Paid
          >
            Save Changes
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default EditValidationModal;
