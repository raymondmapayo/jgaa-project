/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  notification,
  Popconfirm,
  Table,
  Upload,
} from "antd";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

interface AddCategoriesFormProps {
  isAddModalVisible: boolean;
  onClose: () => void;
  onAddCategory: (values: any) => void;
}

const AddCategories: React.FC<AddCategoriesFormProps> = ({
  isAddModalVisible,
  onClose,
  onAddCategory,
}) => {
  const [form] = Form.useForm();

  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [existingCategories, setExistingCategories] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isInsertingSingle, setIsInsertingSingle] = useState(false);
  const [isInsertingAll, setIsInsertingAll] = useState(false);

  // Keeps one preview URL per queued file (avoids creating a new one every render)
  const previewUrls = useRef(new WeakMap<object, string>());
  const getPreviewUrl = (file: any) => {
    const key = file.originFileObj;
    let url = previewUrls.current.get(key);
    if (!url) {
      url = URL.createObjectURL(key);
      previewUrls.current.set(key, url);
    }
    return url;
  };

  // Fetch existing categories when modal opens
  useEffect(() => {
    if (isAddModalVisible) {
      fetchCategories();
    }
  }, [isAddModalVisible]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_categories`);
      setExistingCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch categories.",
      });
    }
  };
  // Reset everything when closing
  const handleCancel = () => {
    form.resetFields();
    setCategoryList([]);
    onClose();
  };

  // Add one to list (not inserted yet)
  const handleAddToTable = async () => {
    if (isAddingToList || isInsertingSingle || isInsertingAll) return;

    setIsAddingToList(true);

    try {
      const values = await form.validateFields();

      if (!values.categories_img?.fileList?.[0]) {
        notification.error({
          message: "Error",
          description: "Category image is required.",
        });
        return;
      }

      const isDuplicate =
        existingCategories.some(
          (cat: any) =>
            cat.categories_name.toLowerCase().trim() ===
            values.categories_name.toLowerCase().trim(),
        ) ||
        categoryList.some(
          (cat) =>
            cat.categories_name.toLowerCase().trim() ===
            values.categories_name.toLowerCase().trim(),
        );

      if (isDuplicate) {
        notification.error({
          message: "Duplicate Category",
          description: `This "${values.categories_name}" category already exists in the database or in your queue.`,
        });
        return;
      }

      const newCategory = {
        categories_name: values.categories_name,
        description: values.description,
        categories_img: values.categories_img.fileList[0],
      };

      setCategoryList((prev) => [...prev, newCategory]);
      form.resetFields();
    } catch (err) {
      console.log("Validation failed:", err);
    } finally {
      setIsAddingToList(false);
    }
  };
  // Insert only one immediately
  const handleInsertSingle = async () => {
    if (isAddingToList || isInsertingSingle || isInsertingAll) return;

    setIsInsertingSingle(true);

    try {
      const values = await form.validateFields();

      if (!values.categories_img?.fileList?.[0]) {
        notification.error({
          message: "Error",
          description: "Category image is required.",
        });
        return;
      }

      const formData = new FormData();

      formData.append("categories_name", values.categories_name);
      formData.append("description", values.description || "");

      formData.append(
        "categories_img",
        values.categories_img.fileList[0].originFileObj,
      );

      const response = await axios.post(`${apiUrl}/add_categories`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        onAddCategory(response.data.data);

        notification.success({
          message: "Category Added",
          description: "The category has been added successfully!",
        });

        form.resetFields();
        handleCancel();
      }
    } catch (error) {
      console.error("Error adding category:", error);

      notification.error({
        message: "Error",
        description: "Failed to add category. Please try again later.",
      });
    } finally {
      setIsInsertingSingle(false);
    }
  };
  // Delete row from list
  const handleDeleteRow = (index: number) => {
    setCategoryList((prev) => prev.filter((_, i) => i !== index));
  };

  // Insert all from list
  const handleInsertAll = async () => {
    if (isAddingToList || isInsertingSingle || isInsertingAll) return;

    if (categoryList.length === 0) {
      notification.error({
        message: "Error",
        description: "No categories to insert.",
      });
      return;
    }

    setIsInsertingAll(true);

    try {
      for (const cat of categoryList) {
        const formData = new FormData();

        formData.append("categories_name", cat.categories_name);
        formData.append("description", cat.description || "");
        formData.append("categories_img", cat.categories_img.originFileObj);

        const response = await axios.post(
          `${apiUrl}/add_categories`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (response.data.success) {
          onAddCategory(response.data.data);
        }
      }

      notification.success({
        message: "Categories Added",
        description: "All categories have been added successfully!",
      });

      setCategoryList([]);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Error adding categories:", error);

      notification.error({
        message: "Error",
        description: "Failed to add categories. Please try again later.",
      });
    } finally {
      setIsInsertingAll(false);
    }
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "categories_name",
      key: "categories_name",
      render: (_: any, record: any) => (
        <div className="flex min-w-[200px] items-center gap-3">
          {record.categories_img?.originFileObj && (
            <img
              src={getPreviewUrl(record.categories_img)}
              alt={record.categories_name}
              className="h-12 w-12 flex-shrink-0 rounded-xl object-cover shadow-sm ring-2 ring-white"
            />
          )}
          <span className="font-semibold text-gray-900">
            {record.categories_name}
          </span>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text?: string) =>
        text ? (
          <p className="m-0 line-clamp-2 max-w-[220px] text-sm text-gray-500">
            {text}
          </p>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Popconfirm
          title="Are you sure to remove this category?"
          onConfirm={() => handleDeleteRow(index)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      open={isAddModalVisible}
      onCancel={handleCancel}
      footer={null}
      width={600}
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
              Add new category
            </h2>
            <p className="m-0 mt-0.5 text-sm text-gray-500">
              Insert one category now, or queue several and insert them
              together.
            </p>
          </div>
        </div>
      </div>

      {/* ================= Body (scrolls if tall) ================= */}
      <div className="max-h-[72vh] overflow-y-auto bg-white px-6 pb-6 pt-5 sm:px-8">
        <Form layout="vertical" form={form} requiredMark={false}>
          <Form.Item
            label={<span className="font-semibold">Category name</span>}
            name="categories_name"
            rules={[{ required: true, message: "Category name is required" }]}
          >
            <Input size="large" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold">Description</span>}
            name="description"
          >
            <Input.TextArea
              rows={3}
              maxLength={300}
              showCount
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold">Category image</span>}
            name="categories_img"
            extra="PNG, JPG or JPEG"
            rules={[{ required: true, message: "Category image is required" }]}
          >
            <Upload
              beforeUpload={(file) => {
                const isValidType =
                  file.type === "image/png" ||
                  file.type === "image/jpeg" ||
                  file.type === "image/jpg";

                if (!isValidType) {
                  notification.error({
                    message: "Invalid File Type",
                    description:
                      "Only .png, .jpg, and .jpeg pictures are allowed.",
                  });
                  return Upload.LIST_IGNORE;
                }

                return false;
              }}
              maxCount={1}
              listType="picture"
            >
              <Button size="large" icon={<UploadOutlined />}>
                Upload category image
              </Button>
            </Upload>
          </Form.Item>

          {/* Buttons */}
          <div className="border-t border-dashed border-gray-200 pt-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                size="large"
                onClick={handleAddToTable}
                type="dashed"
                icon={<PlusOutlined />}
                loading={isAddingToList}
                disabled={isInsertingSingle || isInsertingAll}
              >
                {isAddingToList ? "Adding..." : "Add to list"}
              </Button>
              <Button
                size="large"
                type="primary"
                onClick={handleInsertSingle}
                loading={isInsertingSingle}
                disabled={isAddingToList || isInsertingAll}
              >
                {isInsertingSingle ? "Inserting..." : "Insert now"}
              </Button>
            </div>

            <p className="m-0 mt-3 text-xs text-gray-500 sm:text-right">
              <strong>Insert now</strong> saves it right away.{" "}
              <strong>Add to list</strong> queues it so you can insert several
              categories at once.
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
              dataSource={categoryList.map((item, index) => ({
                ...item,
                key: index,
              }))}
              columns={columns}
              pagination={false}
              scroll={{ x: 520 }}
              size="small"
            />

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button size="large" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="large"
                type="primary"
                onClick={handleInsertAll}
                loading={isInsertingAll}
                disabled={isAddingToList || isInsertingSingle}
              >
                {isInsertingAll
                  ? "Inserting all..."
                  : `Insert all (${categoryList.length})`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddCategories;
