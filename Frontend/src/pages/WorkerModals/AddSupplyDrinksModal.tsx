/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
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
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
      render: (name: string) => (
        <span className="font-semibold text-gray-900">{name}</span>
      ),
    },
    {
      title: "Stock in",
      dataIndex: "stock_in",
      key: "stock_in",
      render: (qty: number, record: any) => (
        <span className="whitespace-nowrap">
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <span className="whitespace-nowrap font-bold text-gray-900">
          ₱{Number(price).toLocaleString()}
        </span>
      ),
    },
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
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={640}
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
              Add drinks supply
            </h2>
            <p className="m-0 mt-0.5 text-sm text-gray-500">
              Insert one supply now, or queue several and insert them together.
            </p>
          </div>
        </div>
      </div>

      {/* ================= Body (scrolls if tall) ================= */}
      <div className="max-h-[72vh] overflow-y-auto bg-white px-6 pb-6 pt-5 sm:px-8">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Product name</span>}
                name="product_name"
                rules={[
                  { required: true, message: "Please select product name" },
                ]}
              >
                <Select
                  size="large"
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

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Unit</span>}
                name="unit"
                extra={
                  selectedProduct && unitOptions.length === 0
                    ? "No units found for this drink."
                    : undefined
                }
                rules={[{ required: true, message: "Please select a unit" }]}
              >
                <Select
                  size="large"
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

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Stock in</span>}
                name="stock_in"
                rules={[{ required: true, message: "Please enter stock in" }]}
              >
                <InputNumber
                  size="large"
                  min={0}
                  style={{ width: "100%" }}
                  className="rounded-xl"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Price</span>}
                name="price"
                rules={[{ required: true, message: "Please enter price" }]}
              >
                <InputNumber
                  size="large"
                  min={0}
                  addonBefore="₱"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Buttons */}
          <div className="border-t border-dashed border-gray-200 pt-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                size="large"
                onClick={handleAddToList}
                type="dashed"
                icon={<PlusOutlined />}
                disabled={isLoading}
              >
                Add to list
              </Button>
              <Button
                size="large"
                type="primary"
                onClick={handleInsertSingle}
                loading={isLoading}
              >
                Insert now
              </Button>
            </div>

            <p className="m-0 mt-3 text-xs text-gray-500 sm:text-right">
              <strong>Insert now</strong> saves it right away.{" "}
              <strong>Add to list</strong> queues it so you can insert several
              supplies at once.
            </p>
          </div>
        </Form>

        {/* ✅ Queue preview if list has items */}
        {supplyList.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-base font-bold text-gray-900">
                Queued supplies
              </h3>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                {supplyList.length}
              </span>
            </div>

            <Table
              dataSource={supplyList.map((item, index) => ({
                ...item,
                key: index,
              }))}
              columns={columns}
              pagination={false}
              scroll={{ x: 480 }}
              size="small"
            />

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button size="large" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                size="large"
                type="primary"
                onClick={handleInsertAll}
                loading={isLoading}
              >
                Insert all ({supplyList.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddSupplyDrinksModal;
