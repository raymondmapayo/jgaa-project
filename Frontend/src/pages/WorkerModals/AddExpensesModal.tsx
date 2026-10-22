// AddExpensesModal.tsx
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  message,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

const { Option } = Select;

interface AddExpensesModalProps {
  visible: boolean;
  onClose: () => void;
  onFinish: (newExpense: any) => void;
}

const AddExpensesModal: React.FC<AddExpensesModalProps> = ({
  visible,
  onClose,
  onFinish,
}) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const user_id = sessionStorage.getItem("user_id");
  useEffect(() => {
    if (visible) {
      fetchCategories();
      fetchSubcategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get_expenses_categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      message.error("Failed to fetch categories");
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get_expenses_subcategories`);
      setSubcategories(res.data);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      message.error("Failed to fetch subcategories");
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        expense_date: values.expense_date.format("YYYY-MM-DD"),
        amount: parseInt(values.amount, 10),
        created_by: user_id,
      };

      const res = await axios.post(`${apiUrl}/add_expenses`, payload);
      message.success("Expense added successfully!");
      onFinish(res.data);
      form.resetFields();
      onClose();
    } catch (err) {
      console.error("Error adding expense:", err);
      message.error("Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={680}
      centered
      styles={{
        content: { padding: 0, borderRadius: 28, overflow: "hidden" },
        body: { padding: 0 },
      }}
    >
      {/* ================= Header ================= */}
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe,transparent_50%)] bg-white px-6 pb-5 pt-6 sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-blue-200/70" />
        <div className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 rounded-full border border-blue-200/70" />

        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-500/30">
            <PlusOutlined />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 text-xl font-extrabold leading-tight text-gray-900">
              Add expense
            </h2>
            <p className="m-0 mt-0.5 text-sm text-gray-500">
              Record a new expense with its date, amount and details.
            </p>
          </div>
        </div>
      </div>

      {/* ================= Body (scrolls if tall) ================= */}
      <div className="max-h-[72vh] overflow-y-auto bg-white px-6 pb-6 pt-5 sm:px-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Expense date</span>}
                name="expense_date"
                rules={[{ required: true, message: "Please select a date" }]}
              >
                <DatePicker size="large" className="w-full rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Amount</span>}
                name="amount"
                rules={[{ required: true, message: "Please enter amount" }]}
              >
                <Input
                  size="large"
                  type="number"
                  prefix="₱"
                  placeholder="0"
                  className="rounded-xl"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Category</span>}
                name="category"
                rules={[
                  { required: true, message: "Please select a category" },
                ]}
              >
                <Select size="large" placeholder="Select category">
                  {categories.map((cat) => (
                    <Option key={cat.expenses_category_id} value={cat.category}>
                      {cat.category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Subcategory</span>}
                name="subcategory"
                rules={[
                  { required: true, message: "Please select a subcategory" },
                ]}
              >
                <Select size="large" placeholder="Select subcategory">
                  {subcategories.map((sub) => (
                    <Option
                      key={sub.expenses_subcategory_id}
                      value={sub.subcategory}
                    >
                      {sub.subcategory}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Payment method</span>}
                name="method"
                rules={[
                  { required: true, message: "Please enter payment method" },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Cash, GCash, etc."
                  className="rounded-xl"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Receipt no.</span>}
                name="receipt_no"
              >
                <Input
                  size="large"
                  placeholder="Receipt number (optional)"
                  className="rounded-xl"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label={<span className="font-semibold">Description</span>}
                name="description"
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <Input.TextArea
                  placeholder="What was this expense for?"
                  rows={3}
                  maxLength={300}
                  showCount
                  className="rounded-xl"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label={<span className="font-semibold">Remarks</span>}
                name="remarks"
              >
                <Input
                  size="large"
                  placeholder="Remarks (optional)"
                  className="rounded-xl"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-2 flex flex-col-reverse gap-2 border-t border-dashed border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <Button
              size="large"
              onClick={handleCancel}
              disabled={saving}
              className="sm:min-w-[110px]"
            >
              Cancel
            </Button>
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              loading={saving}
              className="sm:min-w-[150px]"
            >
              Add expense
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default AddExpensesModal;
