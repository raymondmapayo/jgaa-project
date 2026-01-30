/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeleteOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Table,
  Row,
  Col,
} from "antd";
import axios from "axios";
import React, { useState, useEffect } from "react";

interface AddExpensesCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
}

const AddExpensesCategoryModal: React.FC<AddExpensesCategoryModalProps> = ({
  visible,
  onClose,
  onFinish,
}) => {
  const [form] = Form.useForm();
  const [queueList, setQueueList] = useState<any[]>([]); // queue
  const [existingCategories, setExistingCategories] = useState<any[]>([]); // already in DB
  const apiUrl = import.meta.env.VITE_API_URL;
  const user_id = sessionStorage.getItem("user_id");
  // Fetch existing categories when modal opens
  useEffect(() => {
    if (visible) fetchCategories();
  }, [visible]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get_expenses_categories`);
      setExistingCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      message.error("Failed to fetch existing categories.");
    }
  };

  // Reset modal
  const handleCancel = () => {
    form.resetFields();
    setQueueList([]);
    onClose();
  };

  // Add one category directly to DB
  const handleAddOne = async (values: any) => {
    const isDuplicate = existingCategories.some(
      (cat) =>
        cat.category.toLowerCase().trim() ===
        values.category.toLowerCase().trim()
    );

    if (isDuplicate) {
      message.error("Category already exists in database.");
      return;
    }

    try {
      // ✅ Send plain JSON instead of FormData
      const response = await axios.post(`${apiUrl}/add_expenses_category`, {
        category: values.category,
        status: "Active",
        created_by: user_id,
      });

      if (response.data.success) {
        message.success("Category added successfully!");
        fetchCategories();
        form.resetFields();
        onFinish(response.data);
      }
    } catch (err) {
      console.error("Error adding category:", err);
      message.error("Failed to add category. Try again.");
    }
  };
  // Add category to queue
  const handleAddToList = (values: any) => {
    const isDuplicate =
      existingCategories.some(
        (cat) =>
          cat.category.toLowerCase().trim() ===
          values.category.toLowerCase().trim()
      ) ||
      queueList.some(
        (cat) =>
          cat.category.toLowerCase().trim() ===
          values.category.toLowerCase().trim()
      );

    if (isDuplicate) {
      message.error(
        `"${values.category}" already exists in DB or in your queue.`
      );
      return;
    }

    setQueueList([...queueList, values]);
    form.resetFields();
  };

  // Remove from queue
  const handleRemoveFromQueue = (index: number) => {
    const updated = [...queueList];
    updated.splice(index, 1);
    setQueueList(updated);
  };

  // Insert all queued categories to DB
  const handleInsertAll = async () => {
    try {
      for (const item of queueList) {
        await axios.post(`${apiUrl}/add_expenses_category`, {
          category: item.category,
          status: "Active",
          created_by: user_id,
        });
      }
      message.success("All queued categories added successfully!");
      setQueueList([]);
      fetchCategories();
    } catch (err) {
      console.error("Error inserting queued categories:", err);
      message.error("Failed to insert queued categories. Try again.");
    }
  };

  const columns = [
    { title: "Category Name", dataIndex: "category", key: "category" },
    {
      title: "Action",
      key: "action",
      render: (_: any, __: any, index: number) => (
        <Popconfirm
          title="Remove this category?"
          onConfirm={() => handleRemoveFromQueue(index)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title="Add Expense Category"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Category Name"
          name="category"
          rules={[{ required: true, message: "Please enter category name" }]}
        >
          <Input placeholder="Enter category name" />
        </Form.Item>

        <Row justify="end" gutter={16} className="mb-4">
          <Col>
            <Button onClick={handleCancel}>Cancel</Button>
          </Col>
          <Col>
            <Button
              onClick={() => {
                form
                  .validateFields()
                  .then((values) => handleAddOne(values))
                  .catch(() => {});
              }}
            >
              Add One
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={() => {
                form
                  .validateFields()
                  .then((values) => handleAddToList(values))
                  .catch(() => {});
              }}
            >
              Add to List
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Queue Table */}
      {queueList.length > 0 && (
        <>
          <Table
            dataSource={queueList.map((item, index) => ({
              ...item,
              key: index,
            }))}
            columns={columns}
            pagination={false}
            bordered
          />
          <div className="flex justify-end mt-3">
            <Button type="primary" onClick={handleInsertAll}>
              Insert All
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default AddExpensesCategoryModal;
