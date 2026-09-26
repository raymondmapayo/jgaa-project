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
      const response = await axios.get(`${apiUrl}/get_expenses_subcategories`);

      setExistingCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);

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
        values.subcategory.toLowerCase().trim(),
    );

    if (isDuplicate) {
      message.warning("SubCategory already exists in database.");
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/add_expenses_subcategory`, {
        subcategory: values.subcategory,
        status: "Active",
        created_by: user_id,
      });

      if (response.data.success) {
        // Update parent table
        onFinish(response.data);

        // Fetch latest data
        await fetchSubCategories();

        form.resetFields();

        message.success("SubCategory added successfully!");
      }
    } catch (error) {
      console.error("Error adding subcategory:", error);

      message.error("Failed to add subcategory. Try again.");
    }
  };

  // Add subcategory to queue
  const handleAddToList = (values: any) => {
    const isDuplicate =
      existingCategories.some(
        (cat) =>
          cat.subcategory.toLowerCase().trim() ===
          values.subcategory.toLowerCase().trim(),
      ) ||
      queueList.some(
        (cat) =>
          cat.subcategory.toLowerCase().trim() ===
          values.subcategory.toLowerCase().trim(),
      );

    if (isDuplicate) {
      message.error(
        `"${values.subcategory}" already exists in DB or in your queue.`,
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
      const addedSubCategories = [];

      for (const item of queueList) {
        const response = await axios.post(
          `${apiUrl}/add_expenses_subcategory`,
          {
            subcategory: item.subcategory,
            status: "Active",
            created_by: user_id,
          },
        );

        if (response.data.success) {
          addedSubCategories.push(response.data);
        }
      }

      // Update parent table, same as Add One
      for (const subcategory of addedSubCategories) {
        onFinish(subcategory);
      }

      // Fetch latest database data
      await fetchSubCategories();

      // Clear queue
      setQueueList([]);

      message.success("All queued subcategories added successfully!");
    } catch (error) {
      console.error("Error inserting queued subcategories:", error);

      message.error("Failed to insert queued subcategories. Try again.");
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

  const handleAddOneClick = async () => {
    try {
      const values = await form.validateFields();

      await handleAddOne(values);
    } catch (error) {
      // Validation error
    }
  };

  const handleAddToListClick = async () => {
    try {
      const values = await form.validateFields();

      handleAddToList(values);
    } catch (error) {
      // Validation error
    }
  };

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
            <Button onClick={handleAddOneClick}>Add One</Button>
          </Col>
          <Col>
            <Button type="primary" onClick={handleAddToListClick}>
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
