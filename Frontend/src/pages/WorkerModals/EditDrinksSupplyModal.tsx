import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface EditDrinksSupplyModalProps {
  visible: boolean;
  selectedItem: any | null;
  onClose: () => void;
  onFinish: (values: any) => void;
}

const EditDrinksSupplyModal: React.FC<EditDrinksSupplyModalProps> = ({
  visible,
  selectedItem,
  onClose,
  onFinish,
}) => {
  const [form] = Form.useForm();
  const [remainingStock, setRemainingStock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (visible && selectedItem) {
      form.setFieldsValue({
        product_name: selectedItem.product_name,
        stock_in: selectedItem.stock_in,
        unit: selectedItem.unit,
        price: selectedItem.price,
      });

      setRemainingStock(Number(selectedItem.stock_in) || 0);
    }
  }, [visible, selectedItem, form]);

  // Update remaining stock when stock_in changes
  const handleValuesChange = (_: any, allValues: any) => {
    if (allValues.stock_in !== undefined) {
      setRemainingStock(Number(allValues.stock_in) || 0);
    }
  };

  const handleOk = async () => {
    if (!selectedItem) {
      message.error("No drinks supply selected.");
      return;
    }

    setIsLoading(true);

    try {
      const values = await form.validateFields();

      const response = await axios.put(
        `${apiUrl}/update_drinks_supply/${selectedItem.supply_drinks_id}`,
        {
          stock_in: values.stock_in,
          price: values.price,
        },
      );

      if (response.data.success) {
        message.success(
          response.data.message || "Drinks supply updated successfully.",
        );

        onFinish({
          ...selectedItem,
          stock_in: values.stock_in,
          price: values.price,
        });

        onClose();
      } else {
        message.error(
          response.data.message || "Failed to update drinks supply.",
        );
      }
    } catch (error: any) {
      console.error(
        "Error updating drinks supply:",
        error.response?.data || error,
      );

      message.error(
        error.response?.data?.message ||
          "Failed to update drinks supply. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Drinks Supply"
      open={visible}
      onCancel={onClose}
      closable={!isLoading}
      maskClosable={!isLoading}
      keyboard={!isLoading}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>,

        <Button
          key="submit"
          type="primary"
          onClick={handleOk}
          loading={isLoading}
        >
          Save Changes
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Product Name" name="product_name">
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Stock In"
              name="stock_in"
              rules={[
                {
                  required: true,
                  message: "Please enter stock in",
                },
              ]}
            >
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Price"
              name="price"
              rules={[
                {
                  required: true,
                  message: "Please enter price",
                },
              ]}
            >
              <InputNumber min={0} precision={2} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Unit" name="unit">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={<strong>Remaining Stock:</strong>}>
              <strong>{remainingStock}</strong>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditDrinksSupplyModal;
