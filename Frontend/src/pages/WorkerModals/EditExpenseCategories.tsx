import { Button, Form, Input, Modal, notification } from "antd";
import axios from "axios";
import { useEffect } from "react";

interface EditExpenseCategoriesProps {
  isEditModalVisible: boolean;
  setIsEditModalVisible: (visible: boolean) => void;
  selectedItem: any;

  // 🔥 ADD THESE TWO (IMPORTANT)
  setDataSource: any;
  setCurrentPage: any;
}

const EditExpenseCategories: React.FC<EditExpenseCategoriesProps> = ({
  isEditModalVisible,
  setIsEditModalVisible,
  selectedItem,
  setDataSource,
  setCurrentPage,
}) => {
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_API_URL;

  // ✅ REPLACE THIS PART (THIS IS THE CORRECT PLACE)
  useEffect(() => {
    if (isEditModalVisible && selectedItem) {
      form.setFieldsValue({
        category: selectedItem.category,
      });
    }
  }, [isEditModalVisible, selectedItem]);
  // ✅ END FIX

  // ✅ Handle form submit
  const handleFinish = async (values: any) => {
    try {
      const user_id = sessionStorage.getItem("user_id");

      const response = await axios.put(
        `${apiUrl}/update_expenses_category/${selectedItem.expenses_category_id}`,
        {
          expenses_category_name: values.category,
          updated_by: user_id,
        },
      );

      if (response.data.success) {
        // 🔥 ================================
        // ✅ THIS IS THE FIX (NO RELOAD NEEDED)
        // 🔥 UPDATE TABLE STATE IMMEDIATELY
        // 🔥 ================================
        setDataSource((prevData: any[]) =>
          prevData.map((cat: any) =>
            cat.expenses_category_id === selectedItem.expenses_category_id
              ? {
                  ...cat,
                  category: values.category, // update UI instantly
                }
              : cat,
          ),
        );

        setCurrentPage(1);

        notification.success({
          message: "Success",
          description: "Expense category updated successfully!",
        });

        setIsEditModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      console.error(error);

      notification.error({
        message: "Error",
        description: "Failed to update expense category.",
      });
    }
  };

  return (
    <Modal
      title="Edit Expense Category"
      open={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      footer={null}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          expenses_category_name: selectedItem?.category || "",
        }}
      >
        <Form.Item
          label="Category Name"
          name="category"
          rules={[{ required: true, message: "Please enter a category name!" }]}
        >
          <Input placeholder="Enter expense category name" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Update Category
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditExpenseCategories;
