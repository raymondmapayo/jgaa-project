/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Table,
  notification,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface AddSupplyCategoriesProps {
  isAddModalVisible: boolean;
  onClose: () => void;
  onAddCategory: (values: any) => void;
}

const AddSupplyCategories: React.FC<AddSupplyCategoriesProps> = ({
  isAddModalVisible,
  onClose,
  onAddCategory,
}) => {
  const [form] = Form.useForm();
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [existingCategories, setExistingCategories] = useState<any[]>([]);

  const user_id = sessionStorage.getItem("user_id");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch categories when modal opens
  useEffect(() => {
    const loadCategories = async () => {
      if (!isAddModalVisible) return;

      await fetchSupplyCategories();
    };

    loadCategories();
  }, [isAddModalVisible]);

  // Fetch existing categories
  const fetchSupplyCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_supply_categories`);

      setExistingCategories(response.data);
    } catch (error) {
      console.error("Error fetching supply categories:", error);

      notification.error({
        message: "Error",
        description: "Failed to fetch supply categories.",
      });
    }
  };

  // Add one category directly to database
  const handleSubmitOne = async (values: any) => {
    const isDuplicate = existingCategories.some(
      (cat) =>
        cat.supply_cat_name.toLowerCase().trim() ===
        values.supply_cat_name.toLowerCase().trim(),
    );

    if (isDuplicate) {
      notification.error({
        message: "Duplicate Category",
        description: "This category already exists in the database.",
      });
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/add_supply_category`, {
        supply_cat_name: values.supply_cat_name,
        created_by: user_id,
      });

      form.resetFields();

      // Same logic
      await fetchSupplyCategories();

      onAddCategory(response.data);

      notification.success({
        message: "Supply Category Added",
        description: "New supply category has been added successfully!",
      });
    } catch (error) {
      console.error("Error adding supply category:", error);

      notification.error({
        message: "Error",
        description: "Failed to add supply category. Please try again later.",
      });
    }
  };
  // Add category to temporary queue
  const handleAddToList = (values: any) => {
    const isDuplicate =
      existingCategories.some(
        (cat) =>
          cat.supply_cat_name.toLowerCase().trim() ===
          values.supply_cat_name.toLowerCase().trim(),
      ) ||
      categoryList.some(
        (cat) =>
          cat.supply_cat_name.toLowerCase().trim() ===
          values.supply_cat_name.toLowerCase().trim(),
      );

    if (isDuplicate) {
      notification.error({
        message: "Duplicate Category",
        description: `"${values.supply_cat_name}" already exists in the database or in your queue.`,
      });

      return;
    }

    const newItem = {
      ...values,
    };

    setCategoryList((prev) => [...prev, newItem]);

    form.resetFields();
  };

  // Remove category from queue
  const handleRemoveFromList = (index: number) => {
    setCategoryList((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  // Insert all queued categories

  const handleSubmitAll = async () => {
    try {
      const addedCategories = [];

      for (const item of categoryList) {
        const response = await axios.post(`${apiUrl}/add_supply_category`, {
          supply_cat_name: item.supply_cat_name,
          created_by: user_id,
        });

        addedCategories.push(response.data);
      }

      // Update parent/main table
      for (const category of addedCategories) {
        onAddCategory(category);
      }

      // Refresh local categories
      await fetchSupplyCategories();

      setCategoryList([]);

      notification.success({
        message: "Supply Categories Added",
        description: "All queued categories have been added successfully!",
      });
    } catch (error) {
      console.error("Error inserting queued categories:", error);

      notification.error({
        message: "Error",
        description: "Failed to insert queued categories. Please try again.",
      });
    }
  };
  // Validate and add one
  const handleAddOne = async () => {
    try {
      const values = await form.validateFields();

      await handleSubmitOne(values);
    } catch (error) {
      // Ignore Ant Design validation errors
    }
  };

  // Validate and add to queue
  const handleAddToQueue = async () => {
    try {
      const values = await form.validateFields();

      handleAddToList(values);
    } catch (error) {
      // Ignore Ant Design validation errors
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Category Name",
      dataIndex: "supply_cat_name",
    },
    {
      title: "Action",
      render: (_: any, _record: any, index: number) => (
        <Button danger size="small" onClick={() => handleRemoveFromList(index)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="Add New Supply Category"
      open={isAddModalVisible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Supply Category Name"
              name="supply_cat_name"
              rules={[
                {
                  required: true,
                  message: "Supply category name is required",
                },
              ]}
            >
              <Input placeholder="Enter supply category name" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2 mb-4">
          <Button onClick={() => form.resetFields()}>Clear</Button>

          <Button onClick={handleAddOne}>Add One</Button>

          <Button type="primary" onClick={handleAddToQueue}>
            Add to List
          </Button>
        </div>
      </Form>

      {categoryList.length > 0 && (
        <>
          <Table
            dataSource={categoryList}
            columns={columns}
            rowKey={(_, index) => index!.toString()}
            pagination={false}
            size="small"
            scroll={{ x: 500 }}
          />

          <div className="flex justify-end mt-3">
            <Button type="primary" onClick={handleSubmitAll}>
              Insert All
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default AddSupplyCategories;
