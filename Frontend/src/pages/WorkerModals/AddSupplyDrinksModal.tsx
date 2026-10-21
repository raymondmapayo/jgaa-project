/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeleteOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Table,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface AddSupplyDrinksModalProps {
  visible: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  onSuccess: () => void;
}

const AddSupplyDrinksModal: React.FC<AddSupplyDrinksModalProps> = ({
  visible,
  onClose,
  onFinish,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [drinks, setDrinks] = useState<any[]>([]); // ✅ NEW: drinks list
  const [supplyList, setSupplyList] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);
  const user_id = sessionStorage.getItem("user_id");
  const selectedProduct = Form.useWatch("product_name", form);

  const unitOptions = [
    ...new Set(
      drinks
        .filter((drink) => drink.item_name === selectedProduct && drink.unit)
        .map((drink) => String(drink.unit).trim())
        .filter(Boolean),
    ),
  ];
  // ✅ Fetch drinks only
  useEffect(() => {
    if (visible) {
      const fetchDrinks = async () => {
        try {
          const res = await axios.get(`${apiUrl}/menu_items_drinks`);
          setDrinks(res.data);
        } catch (err) {
          console.error("Error fetching drinks:", err);
        }
      };
      fetchDrinks();
    }
  }, [visible]);

  // ✅ Reset when closing
  const handleCancel = () => {
    form.resetFields();
    setSupplyList([]);
    onClose();
  };

  // ✅ Add to list (with preview)
  const handleAddToList = async () => {
    try {
      const values = await form.validateFields();

      const newSupply = {
        ...values,
        category: "Drinks", // ✅ fixed category
      };

      setSupplyList((prev) => [...prev, newSupply]);
      form.resetFields();
    } catch (err) {
      console.log("Validation failed:", err);
    }
  };

  // ✅ Insert one immediately
  const handleInsertSingle = async () => {
    setIsLoading(true);
    try {
      const values = await form.validateFields();

      const response = await axios.post(`${apiUrl}/add_supply_drinks`, {
        drinks_inventory_id: values.drinks_inventory_id || "",
        product_name: values.product_name, // <-- use underscore
        stock_in: values.stock_in, // <-- use underscore
        unit: values.unit,
        price: values.price,
        status: values.stock_in === 0 ? "Unavailable" : "Available",
        created_by: user_id,
      });

      if (response.data.success) {
        message.success("Supply added successfully!");
        onFinish(values);
        await onSuccess();
        form.resetFields();
        handleCancel();
      } else {
        message.error(response.data.message || "Failed to add supply.");
      }
    } catch (error) {
      console.error("Error adding supply:", error);
      message.error("Failed to add supply. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Delete from list
  const handleDeleteRow = (index: number) => {
    setSupplyList((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Insert all from list
  const handleInsertAll = async () => {
    if (supplyList.length === 0) {
      message.error("No supplies to insert.");
      return;
    }

    setIsLoading(true);
    try {
      for (const supply of supplyList) {
        const response = await axios.post(`${apiUrl}/add_supply_drinks`, {
          drinks_inventory_id: supply.inventory_id || "",
          product_name: supply.product_name,
          stock_in: supply.stock_in,
          unit: supply.unit,
          price: supply.price,
          status: supply.stock_in === 0 ? "Unavailable" : "Available",
          created_by: user_id,
        });

        onFinish(response.data);
      }

      message.success("All supplies inserted successfully!");
      setSupplyList([]);
      await onSuccess();
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Error inserting supplies:", error);
      message.error("Failed to insert supplies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Table columns
  const columns = [
    { title: "Product Name", dataIndex: "product_name", key: "product_name" },
    { title: "Stock In", dataIndex: "stock_in", key: "stock_in" },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    { title: "Price", dataIndex: "price", key: "price" },
    {
      title: "Action",
      key: "action",
      render: (_: any, __: any, index: number) => (
        <Popconfirm
          title="Remove this item?"
          onConfirm={() => handleDeleteRow(index)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title="Add Drinks Supply"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Product Name"
              name="product_name"
              rules={[
                { required: true, message: "Please select product name" },
              ]}
            >
              <Select
                placeholder="Select a product name"
                showSearch
                optionFilterProp="label"
                options={[
                  ...new Map(
                    drinks.map((drink) => [
                      drink.item_name,
                      {
                        value: drink.item_name,
                        label: drink.item_name,
                      },
                    ]),
                  ).values(),
                ]}
                onChange={() => {
                  form.setFieldValue("unit", undefined);
                }}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Stock In"
              name="stock_in"
              rules={[{ required: true, message: "Please enter stock in" }]}
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
              rules={[{ required: true, message: "Please enter price" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Unit"
              name="unit"
              rules={[{ required: true, message: "Please select a unit" }]}
            >
              <Select
                placeholder={
                  selectedProduct ? "Select a unit" : "Select product first"
                }
                disabled={!selectedProduct || unitOptions.length === 0}
                options={unitOptions.map((unit) => ({
                  value: unit,
                  label: unit,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Buttons side by side */}
        <Row justify="end" gutter={16}>
          <Col>
            <Button
              onClick={handleAddToList}
              type="dashed"
              disabled={isLoading}
            >
              Add to List
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={handleInsertSingle}
              loading={isLoading}
            >
              Insert Now
            </Button>
          </Col>
        </Row>
      </Form>

      {/* ✅ Show table preview if list has items */}
      {supplyList.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Table
            dataSource={supplyList.map((item, index) => ({
              ...item,
              key: index,
            }))}
            columns={columns}
            pagination={false}
            scroll={{ x: 500 }}
            bordered
          />

          <Row justify="end" gutter={16} style={{ marginTop: 20 }}>
            <Col>
              <Button onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={handleInsertAll}
                loading={isLoading}
              >
                Insert All
              </Button>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
};

export default AddSupplyDrinksModal;
