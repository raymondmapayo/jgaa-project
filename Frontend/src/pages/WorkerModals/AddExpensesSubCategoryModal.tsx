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

interface AddExpensesSubCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
}

const AddExpensesSubCategoryModal: React.FC<
  AddExpensesSubCategoryModalProps
> = ({ visible, onClose, onFinish }) => {
  const [form] = Form.useForm();
  const [queueList, setQueueList] = useState<any[]>([]); // queue
  const [existingCategories, setExistingCategories] = useState<any[]>([]); // already in DB
  const apiUrl = import.meta.env.VITE_API_URL;
  const user_id = sessionStorage.getItem("user_id");
  // Fetch existing categories when modal opens
  useEffect(() => {
    if (visible) fetchSubCategories();
  }, [visible]);

  const fetchSubCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get_expenses_subcategories`);
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
      (subcat) =>
        subcat.subcategory.toLowerCase().trim() ===
        values.subcategory.toLowerCase().trim()
    );

    if (isDuplicate) {
      message.warning("SubCategory already exists in database.");
      return;
    }

    try {
      // ✅ Send plain JSON instead of FormData
      const response = await axios.post(`${apiUrl}/add_expenses_subcategory`, {
        subcategory: values.subcategory,
        status: "Active",
        created_by: user_id,
      });

      if (response.data.success) {
        message.success("SubCategory added successfully!");
        fetchSubCategories();
        form.resetFields();
        onFinish(response.data);
      }
    } catch (err) {
      console.error("Error adding subcategory:", err);
      message.error("Failed to add subcategory. Try again.");
    }
  };

  // Add subcategory to queue
  const handleAddToList = (values: any) => {
    const isDuplicate =
      existingCategories.some(
        (cat) =>
          cat.subcategory.toLowerCase().trim() ===
          values.subcategory.toLowerCase().trim()
      ) ||
      queueList.some(
        (cat) =>
          cat.subcategory.toLowerCase().trim() ===
          values.subcategory.toLowerCase().trim()
      );

    if (isDuplicate) {
      message.error(
        `"${values.subcategory}" already exists in DB or in your queue.`
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
        await axios.post(`${apiUrl}/add_expenses_subcategory`, {
          subcategory: item.subcategory,
          status: "Active",
          created_by: user_id,
        });
      }
      message.success("All queued categories added successfully!");
      setQueueList([]);
      fetchSubCategories();
    } catch (err) {
      console.error("Error inserting queued categories:", err);
      message.error("Failed to insert queued categories. Try again.");
    }
  };

  const columns = [
    { title: "Category Name", dataIndex: "subcategory", key: "subcategory" },
    {
      title: "Action",
      key: "action",
      render: (_: any, __: any, index: number) => (
        <Popconfirm
          title="Remove this subcategory?"
          onConfirm={() => handleRemoveFromQueue(index)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title="Add Expense Sub Category"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Sub Category Name"
          name="subcategory"
          rules={[{ required: true, message: "Please enter subcategory name" }]}
        >
          <Input placeholder="Enter subcategory name" />
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

export default AddExpensesSubCategoryModal;
