// AddExpensesModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Row,
  Col,
} from "antd";
import axios from "axios";

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
    }
  };

  return (
    <Modal
      title="Add Expense"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      width={700} // optional: make modal wider for row layout
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Expense Date"
              name="expense_date"
              rules={[{ required: true, message: "Please select a date" }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select placeholder="Select category">
                {categories.map((cat) => (
                  <Option key={cat.expenses_category_id} value={cat.category}>
                    {cat.category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Subcategory"
              name="subcategory"
              rules={[
                { required: true, message: "Please select a subcategory" },
              ]}
            >
              <Select placeholder="Select subcategory">
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

          <Col span={12}>
            <Form.Item
              label="Amount"
              name="amount"
              rules={[{ required: true, message: "Please enter amount" }]}
            >
              <Input type="number" placeholder="₱ Amount" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Payment Method"
              name="method"
              rules={[
                { required: true, message: "Please enter payment method" },
              ]}
            >
              <Input placeholder="Cash, GCash, etc." />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Receipt No." name="receipt_no">
              <Input placeholder="Receipt number" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please enter description" }]}
            >
              <Input.TextArea placeholder="Description" rows={3} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Remarks" name="remarks">
              <Input placeholder="Remarks (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            onClick={() => {
              form.resetFields();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Add Expense
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddExpensesModal;
