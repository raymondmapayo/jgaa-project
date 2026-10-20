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

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (selectedItem) {
      form.setFieldsValue({
        product_name: selectedItem.product_name,
        stock_in: selectedItem.stock_in,
        unit: selectedItem.unit,
        price: selectedItem.price,
      });

      setRemainingStock(selectedItem.stock_in);
    }
  }, [selectedItem, form]);

  // Update remaining stock when stock_in changes
  const handleValuesChange = (_: any, allValues: any) => {
    setRemainingStock(allValues.stock_in || 0);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const response = await axios.put(
        `${apiUrl}/update_drinks_supply/${selectedItem.supply_drinks_id}`,
        {
          product_name: values.product_name,
          stock_in: values.stock_in,
          unit: values.unit,
          price: values.price,
        },
      );

      if (response.data.success) {
        message.success(response.data.message, 1);

        onFinish(values);
        onClose();
      } else {
        message.error(
          response.data.message || "Failed to update drinks supply.",
        );
      }
    } catch (error: any) {
      console.error("❌ Error updating drinks supply:", error);
      message.error("Failed to update drinks supply. Please try again.");
    }
  };

  return (
    <Modal
      title="Edit Drinks Supply"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,

        <Button key="submit" type="primary" onClick={handleOk}>
          Save Changes
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Product Name"
              name="product_name"
              rules={[
                {
                  required: true,
                  message: "Please enter product name",
                },
              ]}
            >
              <Input />
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
              <InputNumber min={0} style={{ width: "100%" }} />
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
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Unit"
              name="unit"
              rules={[
                {
                  required: true,
                  message: "Please enter unit",
                },
              ]}
            >
              <Input />
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
