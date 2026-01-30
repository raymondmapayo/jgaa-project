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
  orderId: number;
  menuImg: string;
  finalTotal: number;
  orderQuantity: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: any) => void;
}

const GCashButton: React.FC<GCashButtonProps> = ({
  amount,
  menuImg,
  orderId,
  orderQuantity,
  finalTotal,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [step, setStep] = useState<"qr" | "form">("qr");
  const [submitting, setSubmitting] = useState(false);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);
  const userId = sessionStorage.getItem("user_id");
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (values: any) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("amount", String(amount));
      formData.append("description", "Payment for Order");
      formData.append("remarks", "Payment for order");
      formData.append("checkout_url", "GCash Manual Payment");
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
      formData.append("order_id", String(orderId));

      const proofFile = values.photo?.[0]?.originFileObj;
      if (proofFile) formData.append("proof_image", proofFile);

      const response = await axios.post(
        `${apiUrl}/gcash_transaction`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      // Store uploaded proof URL from backend
      setUploadedProofUrl(response.data.proof_image);

      await axios.post(`${apiUrl}/gcash_payment`, {
        user_id: userId,
        order_id: orderId,
        amount_paid: amount,
        payment_method: "GCash",
        payment_status: "pending",
      });

      message.success("GCash payment submitted! Waiting for verification.");
      onPaymentSuccess();
    } catch (error) {
      console.error(error);
      message.error("GCash payment failed, please try again.");
      onPaymentError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 flex flex-col items-center space-y-4 w-full">
      {step === "qr" && (
        <>
          <p className="text-sm text-red-600 mb-2 text-center font-medium">
            Note: Screenshot the Receipt payment
          </p>

          <img src="/qr.jpg" alt="GCash QR Code" className="w-60 h-60 mb-4" />

          <div className="w-full flex justify-center">
            <div className="flex items-center bg-gray-200 dark:bg-[#1e293b] rounded-full w-[280px] px-3 py-1.5 border border-gray-300 dark:border-gray-600">
              {/* LEFT SECTION - GRAND TOTAL */}
              <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-100">
                Grand Total: ₱{finalTotal}
              </span>

              {/* RIGHT SECTION - CIRCLE BUTTON */}
              <button
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
                  { required: true, message: "Please enter reference code" },
                ]}
              >
                <Input placeholder="GCash Ref No." className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="time" label="Time" rules={[{ required: true }]}>
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
                  { required: true, message: "Please enter GCash number" },
                ]}
              >
                <Input placeholder="09xxxxxxxxx" className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="photo"
                label="Upload Proof"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                rules={[
                  { required: true, message: "Please upload proof of payment" },
                ]}
              >
                <Upload
                  listType="picture"
                  beforeUpload={() => false} // prevent auto upload
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
                <Button block onClick={() => setStep("qr")}>
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
                  loading={submitting}
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
