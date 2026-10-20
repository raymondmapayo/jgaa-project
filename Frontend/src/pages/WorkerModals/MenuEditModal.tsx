/* eslint-disable @typescript-eslint/no-explicit-any */
import { EditOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Image,
  Input,
  Modal,
  notification,
  Row,
  Spin,
  Upload,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface MenuItem {
  key: string;
  menu_id: number;
  item_name: string;
  category: string;
  price: string;
  description: string;
  menu_img: string;
  availability: string;
}

interface MenuEditModalProps {
  isVisible: boolean;
  selectedItem: MenuItem | null;
  onClose: () => void;
  onSave: (values: MenuItem) => void;
}

const MenuEditModal: React.FC<MenuEditModalProps> = ({
  isVisible,
  selectedItem,
  onClose,
  onSave,
}) => {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (selectedItem) {
      form.setFieldsValue({
        item_name: selectedItem.item_name,
        description: selectedItem.description,
        menu_img: selectedItem.menu_img,
        price: selectedItem.price,
        availability: selectedItem.availability,
      });
    }
  }, [selectedItem, form]);

  const handleFinish = async (values: any) => {
    console.log("Form Submitted:", values);
    setSaving(true);

    const formData = new FormData();
    formData.append("item_name", values.item_name || selectedItem?.item_name);
    formData.append("price", values.price || selectedItem?.price);
    formData.append("availability", selectedItem?.availability || "Available");
    formData.append(
      "description",
      values.description || selectedItem?.description,
    );

    const created_by = sessionStorage.getItem("user_id");
    if (created_by) {
      formData.append("created_by", created_by);
    }

    if (values.menu_img?.fileList?.[0]?.originFileObj) {
      formData.append("menu_img", values.menu_img.fileList[0].originFileObj);
    }

    try {
      const response = await axios.put(
        `${apiUrl}/update_menu/${selectedItem?.menu_id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      console.log("Update response:", response.data);

      if (response.data.success) {
        notification.success({
          message: "Success",
          description: "Menu item has been updated successfully!",
        });

        // ✅ Get updated menu directly from backend
        const updatedMenu = response.data.updatedMenu;

        if (updatedMenu) {
          onSave(updatedMenu); // instantly update parent list
        }

        form.resetFields();
        onClose();
      } else {
        notification.error({
          message: "Error",
          description: "Failed to update menu item. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating menu:", error);
      notification.error({
        message: "Error",
        description: "An error occurred while updating the menu item.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadChange = (info: any) => {
    if (info.file.status === "uploading") {
      setUploading(true);
    } else if (info.file.status === "done" || info.file.status === "error") {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={620}
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
                  Edit food info
                </h2>
                <p className="m-0 mt-0.5 truncate text-sm text-gray-500">
                  Update the details for {selectedItem.item_name}
                </p>
              </div>
            </div>
          </div>

          {/* ================= Form ================= */}
          <Form
            form={form}
            initialValues={selectedItem}
            onFinish={handleFinish}
            layout="vertical"
            requiredMark={false}
            className="bg-white px-6 pb-6 pt-5 sm:px-8"
          >
            {/* Image card */}
            <div className="mb-5 flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-md ring-2 ring-white">
                {selectedItem.menu_img ? (
                  <Image
                    width="100%"
                    height="100%"
                    src={
                      selectedItem.menu_img?.startsWith("http")
                        ? selectedItem.menu_img // Cloudinary full URL
                        : `${apiUrl}/uploads/images/${selectedItem.menu_img}` // Local fallback
                    }
                    alt="Existing Menu Image"
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
                  Menu image
                </p>
                <p className="m-0 mb-3 text-xs text-gray-500">
                  Current photo. Upload a new .png, .jpg or .jpeg to replace it.
                </p>

                <Form.Item name="menu_img" noStyle>
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
                    onChange={handleUploadChange}
                  >
                    <Button icon={<UploadOutlined />}>
                      Upload New Menu Image
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

            <Row gutter={16}>
              <Col xs={24} sm={14}>
                <Form.Item
                  label={<span className="font-semibold">Food name</span>}
                  name="item_name"
                  rules={[{ required: true, message: "Food name is required" }]}
                >
                  <Input size="large" className="rounded-xl" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={10}>
                <Form.Item
                  label={<span className="font-semibold">Price</span>}
                  name="price"
                  rules={[{ required: true, message: "Price is required" }]}
                >
                  <Input size="large" prefix="₱" className="rounded-xl" />
                </Form.Item>
              </Col>
            </Row>

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
                onClick={onClose}
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

export default MenuEditModal;
