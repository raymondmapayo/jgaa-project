import { UploadOutlined } from "@ant-design/icons";
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

    const formData = new FormData();
    formData.append(
      "categories_name",
      values.categories_name || selectedItem.categories_name
    );
    formData.append(
      "description",
      values.description || selectedItem.description
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
        { headers: { "Content-Type": "multipart/form-data" } }
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
          categories_img:
            fileList[0]?.originFileObj?.name || selectedItem.categories_img,
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
      title="Edit Category Info"
      open={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      footer={null}
    >
      {selectedItem && (
        <Form
          layout="vertical"
          form={form}
          initialValues={selectedItem}
          onFinish={handleFinish}
        >
          {/* Existing Image */}
          {selectedItem.categories_img && (
            <Row justify="center">
              <Col
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                  position: "relative",
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #ccc",
                  margin: "0 auto",
                }}
              >
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
              </Col>
              <Col
                span={24}
                style={{ textAlign: "center", marginBottom: "10px" }}
              >
                <strong>Existing Image</strong>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Category Name"
                name="categories_name"
                rules={[
                  { required: true, message: "Category name is required" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Category Image"
                name="categories_img"
                extra="Upload a new image (optional)"
              >
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
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          {uploading && (
            <Row justify="center">
              <Col>
                <Spin /> Uploading...
              </Col>
            </Row>
          )}

          <Row justify="end" gutter={16}>
            <Col>
              <Button onClick={() => setIsEditModalVisible(false)}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Col>
          </Row>
        </Form>
      )}
    </Modal>
  );
};

export default CategoriesEdit;
