import { Button, Form, Input, Modal, notification } from "antd";
import axios from "axios";
import { useEffect } from "react";

interface EditExpenseSubCategoriesProps {
  isEditModalVisible: boolean;
  setIsEditModalVisible: (visible: boolean) => void;
  selectedItem: any;

  // 🔥 ADD THESE TWO (IMPORTANT)
  setDataSource: any;
  setCurrentPage: any;
}

const EditExpenseSubCategories: React.FC<EditExpenseSubCategoriesProps> = ({
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
        subcategory: selectedItem.subcategory,
      });
    }
  }, [isEditModalVisible, selectedItem]);
  // ✅ END FIX

  // ✅ Handle form submit
  const handleFinish = async (values: any) => {
    try {
      const user_id = sessionStorage.getItem("user_id");

      const response = await axios.put(
        `${apiUrl}/update_expenses_subcategory/${selectedItem.expenses_subcategory_id}`,
        {
          expenses_subcategory_name: values.subcategory,
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
            cat.expenses_subcategory_id === selectedItem.expenses_subcategory_id
              ? {
                  ...cat,
                  subcategory: values.subcategory, // update UI instantly
                }
              : cat,
          ),
        );

        setCurrentPage(1);

        notification.success({
          message: "Success",
          description: "Expense subcategory updated successfully!",
        });

        setIsEditModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      console.error(error);

      notification.error({
        message: "Error",
        description: "Failed to update expense subcategory.",
      });
    }
  };

  return (
    <Modal
      title="Edit Expense Subcategory"
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
          subcategory: selectedItem?.subcategory || "",
        }}
      >
        <Form.Item
          label="Subcategory Name"
          name="subcategory"
          rules={[
            { required: true, message: "Please enter a subcategory name!" },
          ]}
        >
          <Input placeholder="Enter expense category name" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Update Subcategory
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditExpenseSubCategories;
