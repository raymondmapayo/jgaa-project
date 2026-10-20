/* eslint-disable @typescript-eslint/no-explicit-any */
import { EditOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Image,
  Input,
  Modal,
  notification,
  Spin,
  Upload,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface CategoryItem {
  key: string;
  categories_name: string;
  categories_img: string;
  description: string;
  status: string;
  categories_id: number;
}

interface CategoriesEditProps {
  isEditModalVisible: boolean;
  setIsEditModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItem: CategoryItem | null;
  handleSaveEdit: (updatedCategory: CategoryItem) => void;
}

const CategoriesEdit: React.FC<CategoriesEditProps> = ({
  isEditModalVisible,
  setIsEditModalVisible,
  selectedItem,
  handleSaveEdit,
}) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (selectedItem) {
      form.setFieldsValue({
        categories_name: selectedItem.categories_name,
        description: selectedItem.description,
      });
      setFileList([]); // reset file list
    }
  }, [selectedItem, form]);

  const handleFinish = async (values: any) => {
    if (!selectedItem) return;
    setSaving(true);

    const formData = new FormData();
    formData.append(
      "categories_name",
      values.categories_name || selectedItem.categories_name,
    );
    formData.append(
      "description",
      values.description || selectedItem.description,
    );
    formData.append("status", selectedItem.status || "active");

    const created_by = sessionStorage.getItem("user_id");
    if (created_by) formData.append("created_by", created_by);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("categories_img", fileList[0].originFileObj);
    }

    try {
      const response = await axios.put(
        `${apiUrl}/update_categories/${selectedItem.categories_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        notification.success({
          message: "Category Updated",
          description: "Category details have been updated successfully!",
        });

        // ✅ Pass the full updated category including id
        const updatedCategory: CategoryItem = {
          ...selectedItem,
          ...values,
          categories_id: selectedItem.categories_id,
          categories_img:
            response.data.updatedCategory.categories_img ||
            selectedItem.categories_img,
        };

        handleSaveEdit(updatedCategory);

        form.resetFields();
        setFileList([]);
        setIsEditModalVisible(false);
      } else {
        notification.error({
          message: "Error",
          description: "Failed to update category. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error editing category:", error);
      notification.error({
        message: "Error",
        description: "An error occurred while updating the category.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadChange = (info: any) => {
    const latestFileList = info.fileList.slice(-1).map((file: any) => {
      if (!file.url && !file.preview && file.originFileObj) {
        file.preview = URL.createObjectURL(file.originFileObj);
      }
      return file;
    });
    setFileList(latestFileList);
    setUploading(info.file.status === "uploading");
  };

  return (
    <Modal
      open={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      footer={null}
      width={600}
      centered
      styles={{
        content: { padding: 0, borderRadius: 28, overflow: "hidden" },
        body: { padding: 0 },
      }}
    >
      {selectedItem && (
        <>
          {/* ================= Header ================= */}
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe,transparent_50%)] bg-white px-6 pb-5 pt-6 sm:px-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-blue-200/70" />
            <div className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 rounded-full border border-blue-200/70" />

            <div className="relative flex items-center gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-500/30">
                <EditOutlined />
              </span>
              <div className="min-w-0">
                <h2 className="m-0 text-xl font-extrabold leading-tight text-gray-900">
                  Edit category info
                </h2>
                <p className="m-0 mt-0.5 truncate text-sm text-gray-500">
                  Update the details for {selectedItem.categories_name}
                </p>
              </div>
            </div>
          </div>

          {/* ================= Form ================= */}
          <Form
            layout="vertical"
            form={form}
            initialValues={selectedItem}
            onFinish={handleFinish}
            requiredMark={false}
            className="bg-white px-6 pb-6 pt-5 sm:px-8"
          >
            {/* Image card */}
            <div className="mb-5 flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-md ring-2 ring-white">
                {selectedItem.categories_img ? (
                  <Image
                    width="100%"
                    height="100%"
                    src={
                      selectedItem.categories_img.startsWith("http")
                        ? selectedItem.categories_img
                        : `${apiUrl}/uploads/images/${selectedItem.categories_img}`
                    }
                    alt="Existing Category Image"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="w-full flex-1 text-center sm:text-left">
                <p className="m-0 text-sm font-bold text-gray-900">
                  Category image
                </p>
                <p className="m-0 mb-3 text-xs text-gray-500">
                  Current photo. Upload a new .png, .jpg or .jpeg to replace it
                  (optional).
                </p>

                <Form.Item name="categories_img" noStyle>
                  <Upload
                    beforeUpload={(file) => {
                      const isValidType = [
                        "image/png",
                        "image/jpeg",
                        "image/jpg",
                      ].includes(file.type);
                      if (!isValidType) {
                        notification.error({
                          message: "Invalid File Type",
                          description:
                            "Only .png, .jpg, and .jpeg pictures are allowed.",
                        });
                        return Upload.LIST_IGNORE;
                      }
                      return false; // manual upload
                    }}
                    fileList={fileList}
                    onChange={handleUploadChange}
                    maxCount={1}
                    listType="picture"
                  >
                    <Button icon={<UploadOutlined />}>
                      Upload New Category Image
                    </Button>
                  </Upload>
                </Form.Item>

                {uploading && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500 sm:justify-start">
                    <Spin size="small" /> Uploading...
                  </div>
                )}
              </div>
            </div>

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

            <div className="mt-2 flex flex-col-reverse gap-2 border-t border-dashed border-gray-200 pt-5 sm:flex-row sm:justify-end">
              <Button
                size="large"
                onClick={() => setIsEditModalVisible(false)}
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
                Save changes
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default CategoriesEdit;
