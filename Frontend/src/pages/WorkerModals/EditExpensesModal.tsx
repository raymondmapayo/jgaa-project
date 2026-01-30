// components/WorkerModals/EditExpensesModal.tsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Row,
  Col,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";

const { Option } = Select;

interface EditExpensesModalProps {
  visible: boolean;
  selectedExpense: any; // ExpenseItem from parent
  onClose: () => void;
  onUpdate: (updatedExpense: any) => void;
}

const EditExpensesModal: React.FC<EditExpensesModalProps> = ({
  visible,
  selectedExpense,
  onClose,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [categories, setCategories] = useState<
    { expenses_category_id: number; category: string }[]
  >([]);
  const [subcategories, setSubcategories] = useState<
    { expenses_subcategory_id: number; subcategory: string }[]
  >([]);

  // Fetch categories and subcategories
  useEffect(() => {
    axios
      .get(`${apiUrl}/get_expenses_categories`)
      .then((res) => setCategories(res.data));
    axios
      .get(`${apiUrl}/get_expenses_subcategories`)
      .then((res) => setSubcategories(res.data));
  }, [apiUrl]);

  // Set form values when selectedExpense changes
  useEffect(() => {
    if (selectedExpense) {
      form.setFieldsValue({
        expense_date: selectedExpense.expense_date
          ? dayjs(selectedExpense.expense_date)
          : null,
        category: selectedExpense.category,
        subcategory: selectedExpense.subcategory,
        description: selectedExpense.description,
        amount: selectedExpense.amount,
        method: selectedExpense.method,
        receipt_no: selectedExpense.receipt_no,
        remarks: selectedExpense.remarks,
      });
    }
  }, [selectedExpense, form]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        expense_date: (values.expense_date as Dayjs).format("YYYY-MM-DD"),
      };
      await axios.put(
        `${apiUrl}/expenses/${selectedExpense.expenses_id}`,
        payload
      );
      message.success("Expense updated successfully!");
      onUpdate({ ...selectedExpense, ...payload });
      onClose();
    } catch (err) {
      console.error("Error updating expense:", err);
      message.error("Failed to update expense.");
    }
  };

  return (
    <Modal
      open={visible}
      title="Edit Expense"
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{}}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Expense Date"
              name="expense_date"
              rules={[{ required: true, message: "Please select a date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Please select category" }]}
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
              rules={[{ required: true, message: "Please select subcategory" }]}
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
              label="Amount (₱)"
              name="amount"
              rules={[{ required: true, message: "Please input amount" }]}
            >
              <Input type="number" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Payment Method"
              name="method"
              rules={[{ required: true, message: "Please select method" }]}
            >
              <Select>
                <Option value="Cash">Cash</Option>
                <Option value="GCash">GCash</Option>
                <Option value="Credit Card">Credit Card</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Receipt No." name="receipt_no">
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Remarks" name="remarks">
              <Input />
            </Form.Item>
          </Col>

          {/* Description at the last, full width */}
          <Col span={24}>
            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please input description" }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Enter detailed description"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditExpensesModal;
