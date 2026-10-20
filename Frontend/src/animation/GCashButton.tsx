import { UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  TimePicker,
  Upload,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import React, { useState } from "react";
import { FaArrowRight } from "react-icons/fa6";

interface GCashButtonProps {
  amount: number;
  menuImg: string;
  finalTotal: number;
  orderQuantity: number;
  onSubmitPayment: () => Promise<number>;
  onPaymentSuccess: (createdOrderId: number) => Promise<void>;
  onPaymentError: (error: any) => void;
}

const GCashButton: React.FC<GCashButtonProps> = ({
  amount,
  menuImg,
  orderQuantity,
  finalTotal,
  onSubmitPayment,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [step, setStep] = useState<"qr" | "form">("qr");
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);
  const userId = sessionStorage.getItem("user_id");
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    if (isLoading) return;

    if (!userId) {
      message.error("User ID not found. Please log in again.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create the order and its items only after Submit Payment.
      const createdOrderId = Number(await onSubmitPayment());

      if (!Number.isInteger(createdOrderId) || createdOrderId <= 0) {
        throw new Error("Failed to create a valid order ID.");
      }

      console.log("Created order ID:", createdOrderId);

      // 2. Prepare the GCash transaction.
      const formData = new FormData();

      formData.append("amount", String(amount));
      formData.append("description", "Payment for Order");
      formData.append("remarks", "Payment for order");
      formData.append("checkout_url", "GCash Manual Payment");

      // Payment is pending until verified by the worker.
      formData.append("payment_method", "GCash");
      formData.append("status", "pending");

      formData.append("created_at", dayjs().format("YYYY-MM-DD HH:mm:ss"));

      formData.append("user_id", String(userId));
      formData.append("order_quantity", String(orderQuantity));
      formData.append("menu_img", menuImg);
      formData.append("reference_code", values.reference || "");
      formData.append("gcash_number", values.gcash || "");
      formData.append("payment_date", dayjs(values.date).format("YYYY-MM-DD"));
      formData.append("payment_time", dayjs(values.time).format("HH:mm:ss"));

      // Use the actual order ID returned by the backend.
      formData.append("order_id", String(createdOrderId));

      const proofFile = values.photo?.[0]?.originFileObj;

      if (!proofFile) {
        throw new Error("Please upload proof of payment.");
      }

      formData.append("proof_image", proofFile);

      // 3. Save the GCash transaction as pending.
      const transactionResponse = await axios.post(
        `${apiUrl}/gcash_transaction`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setUploadedProofUrl(transactionResponse.data.proof_image);

      // 4. Save the payment using the SAME order ID.
      await axios.post(`${apiUrl}/gcash_payment`, {
        user_id: userId,
        order_id: createdOrderId,
        amount_paid: amount,
        payment_method: "GCash",
        payment_status: "pending",
      });

      message.success(
        "GCash payment submitted! Please wait for worker verification.",
      );

      // 5. Complete the checkout using the same order ID.
      await onPaymentSuccess(createdOrderId);
    } catch (error: any) {
      console.error(
        "GCash payment error:",
        error?.response?.data || error?.message || error,
      );

      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "GCash payment submission failed. Please try again.",
      );

      onPaymentError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5 flex flex-col items-center space-y-4 w-full">
      {step === "qr" && (
        <>
          <p className="text-sm text-red-600 mb-2 text-center font-medium">
            Note: Screenshot the receipt after payment.
          </p>

          <img src="/qr.jpg" alt="GCash QR Code" className="w-60 h-60 mb-4" />

          <div className="w-full flex justify-center">
            <div className="flex items-center bg-gray-200 dark:bg-[#1e293b] rounded-full w-[280px] px-3 py-1.5 border border-gray-300 dark:border-gray-600">
              <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-100">
                Grand Total: ₱{finalTotal}
              </span>

              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white"
              >
                <FaArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {step === "form" && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="w-full"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Amount">
                <Input
                  type="number"
                  prefix="₱"
                  value={amount}
                  disabled
                  className="w-full"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="reference"
                label="Reference Code"
                rules={[
                  {
                    required: true,
                    message: "Please enter reference code",
                  },
                ]}
              >
                <Input placeholder="GCash Ref No." className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[
                  {
                    required: true,
                    message: "Please select payment date",
                  },
                ]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="time"
                label="Time"
                rules={[
                  {
                    required: true,
                    message: "Please select payment time",
                  },
                ]}
              >
                <TimePicker className="w-full" format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gcash"
                label="GCash Number"
                rules={[
                  {
                    required: true,
                    message: "Please enter GCash number",
                  },
                ]}
              >
                <Input placeholder="09xxxxxxxxx" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="photo"
                label="Upload Proof"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                rules={[
                  {
                    required: true,
                    message: "Please upload proof of payment",
                  },
                ]}
              >
                <Upload
                  listType="picture"
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*"
                  className="w-full"
                >
                  <Button icon={<UploadOutlined />} className="w-full">
                    Upload Screenshot
                  </Button>
                </Upload>
              </Form.Item>

              {uploadedProofUrl && (
                <img
                  src={uploadedProofUrl}
                  alt="Uploaded Proof"
                  className="w-40 h-40 object-cover rounded-md mt-2 shadow"
                />
              )}
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label=" ">
                <Button
                  block
                  onClick={() => setStep("qr")}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label=" ">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                >
                  Submit Payment
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </div>
  );
};

export default GCashButton;
