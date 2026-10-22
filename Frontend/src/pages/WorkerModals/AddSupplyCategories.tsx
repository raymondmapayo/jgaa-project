/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Table, notification } from "antd";
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
  const [submitting, setSubmitting] = useState<"one" | "all" | null>(null);

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

    setSubmitting("one");

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
    } finally {
      setSubmitting(null);
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
    setSubmitting("all");

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
    } finally {
      setSubmitting(null);
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
      title: "Category",
      dataIndex: "supply_cat_name",
      render: (name: string) => (
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {name}
        </span>
      ),
    },
    {
      title: "Action",
      width: 100,
      render: (_: any, _record: any, index: number) => (
        <Button danger size="small" onClick={() => handleRemoveFromList(index)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={isAddModalVisible}
      onCancel={onClose}
      footer={null}
      width={560}
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
              Add supply category
            </h2>
            <p className="m-0 mt-0.5 text-sm text-gray-500">
              Add one now, or queue several and insert them together.
            </p>
          </div>
        </div>
      </div>

      {/* ================= Body (scrolls if tall) ================= */}
      <div className="max-h-[72vh] overflow-y-auto bg-white px-6 pb-6 pt-5 sm:px-8">
        <Form layout="vertical" form={form} requiredMark={false}>
          <Form.Item
            label={<span className="font-semibold">Supply category name</span>}
            name="supply_cat_name"
            rules={[
              {
                required: true,
                message: "Supply category name is required",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Enter supply category name"
              className="rounded-xl"
              onPressEnter={handleAddToQueue}
            />
          </Form.Item>

          <div className="border-t border-dashed border-gray-200 pt-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                size="large"
                onClick={() => form.resetFields()}
                disabled={submitting !== null}
              >
                Clear
              </Button>
              <Button
                size="large"
                onClick={handleAddOne}
                loading={submitting === "one"}
                disabled={submitting === "all"}
              >
                Add one
              </Button>
              <Button
                size="large"
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddToQueue}
                disabled={submitting !== null}
              >
                Add to list
              </Button>
            </div>

            <p className="m-0 mt-3 text-xs text-gray-500 sm:text-right">
              <strong>Add one</strong> saves it right away.{" "}
              <strong>Add to list</strong> queues it so you can insert several
              at once. Press Enter to add to the list.
            </p>
          </div>
        </Form>

        {/* Queue */}
        {categoryList.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-base font-bold text-gray-900">
                Queued categories
              </h3>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                {categoryList.length}
              </span>
            </div>

            <Table
              dataSource={categoryList}
              columns={columns}
              rowKey={(_, index) => index!.toString()}
              pagination={false}
              size="small"
              scroll={{ x: 400 }}
            />

            <div className="mt-4 flex justify-end">
              <Button
                size="large"
                type="primary"
                onClick={handleSubmitAll}
                loading={submitting === "all"}
                disabled={submitting === "one"}
              >
                Insert all ({categoryList.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddSupplyCategories;
