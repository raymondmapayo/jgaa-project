/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Modal, Popconfirm, Table } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

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
  const [submitting, setSubmitting] = useState<"one" | "all" | null>(null);
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

    setSubmitting("one");

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
    } finally {
      setSubmitting(null);
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
    setSubmitting("all");

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
    } finally {
      setSubmitting(null);
    }
  };

  const columns = [
    {
      title: "Subcategory",
      dataIndex: "subcategory",
      key: "subcategory",
      render: (name: string) => (
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {name}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
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
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={540}
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
              Add expense subcategory
            </h2>
            <p className="m-0 mt-0.5 text-sm text-gray-500">
              Add one now, or queue several and insert them together.
            </p>
          </div>
        </div>
      </div>

      {/* ================= Body (scrolls if tall) ================= */}
      <div className="max-h-[72vh] overflow-y-auto bg-white px-6 pb-6 pt-5 sm:px-8">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<span className="font-semibold">Subcategory name</span>}
            name="subcategory"
            rules={[
              { required: true, message: "Please enter subcategory name" },
            ]}
          >
            <Input
              size="large"
              placeholder="Enter subcategory name"
              className="rounded-xl"
              onPressEnter={handleAddToListClick}
            />
          </Form.Item>

          <div className="border-t border-dashed border-gray-200 pt-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                size="large"
                onClick={handleCancel}
                disabled={submitting !== null}
              >
                Cancel
              </Button>
              <Button
                size="large"
                onClick={handleAddOneClick}
                loading={submitting === "one"}
                disabled={submitting === "all"}
              >
                Add one
              </Button>
              <Button
                size="large"
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddToListClick}
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
        {queueList.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-base font-bold text-gray-900">
                Queued subcategories
              </h3>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                {queueList.length}
              </span>
            </div>

            <Table
              dataSource={queueList.map((item, index) => ({
                ...item,
                key: index,
              }))}
              columns={columns}
              pagination={false}
              size="small"
            />

            <div className="mt-4 flex justify-end">
              <Button
                size="large"
                type="primary"
                onClick={handleInsertAll}
                loading={submitting === "all"}
                disabled={submitting === "one"}
              >
                Insert all ({queueList.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddExpensesSubCategoryModal;
