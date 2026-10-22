/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
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

interface AddSupplyIngredientsModalProps {
  visible: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  onSuccess: () => void;
}

const AddSupplyIngredientsModal: React.FC<AddSupplyIngredientsModalProps> = ({
  visible,
  onClose,
  onFinish,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<
    { cat_supply_id: number; supply_cat_name: string }[]
  >([]);
  const [supplyList, setSupplyList] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const user_id = sessionStorage.getItem("user_id");
  const [isLoading, setIsLoading] = useState(false);
  const unitOptions = ["kg", "g", "pcs", "ml", "liters"];
  // ✅ Fetch categories only
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${apiUrl}/get_supply_categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const fetchSupplies = async () => {
        try {
          const res = await axios.get(`${apiUrl}/get_supply`);
          console.log("Supplies:", res.data);
        } catch (err) {
          console.error("Error fetching supplies:", err);
        }
      };
      fetchSupplies();
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

      const selectedCategory = categories.find(
        (cat) => cat.cat_supply_id === values.cat_supply_id,
      )?.supply_cat_name;

      const newSupply = {
        ...values,
        category: selectedCategory,
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

      const selectedCategory = categories.find(
        (cat) => cat.cat_supply_id === values.cat_supply_id,
      )?.supply_cat_name;

      const response = await axios.post(`${apiUrl}/add_supply_ingredients`, {
        inventoryId: values.inventory_id || "",
        productName: values.product_name,
        category: selectedCategory,
        stockIn: values.stock_in,
        unit: values.unit,
        price: values.price,
        status: values.stock_in === 0 ? "Unavailable" : "Available",
        cat_supply_id: values.cat_supply_id,
        created_by: user_id,
      });

      if (response.data.success) {
        message.success("Supply added successfully!");

        onFinish(values);

        // 🔄 Refresh parent table automatically
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
        const response = await axios.post(`${apiUrl}/add_supply_ingredients`, {
          inventoryId: supply.inventory_id || "",
          productName: supply.product_name,
          category: supply.category,
          stockIn: supply.stock_in,
          unit: supply.unit,
          price: supply.price,
          status: supply.stock_in === 0 ? "Unavailable" : "Available",
          cat_supply_id: supply.cat_supply_id,
          created_by: user_id,
        });

        onFinish(response.data);
      }

      // 🔄 Refresh only once after all supplies are inserted
      await onSuccess();

      message.success("All supplies inserted successfully!");

      setSupplyList([]);
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
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text: string) => (
        <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {text}
        </span>
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
              Add ingredients supply
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
                  { required: true, message: "Please enter product name" },
                ]}
              >
                <Input size="large" className="rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Category</span>}
                name="cat_supply_id"
                rules={[{ required: true, message: "Please select category" }]}
              >
                <Select size="large" placeholder="Select a category">
                  {categories.map((cat) => (
                    <Select.Option
                      key={cat.cat_supply_id}
                      value={cat.cat_supply_id}
                    >
                      {cat.supply_cat_name}
                    </Select.Option>
                  ))}
                </Select>
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
                label={<span className="font-semibold">Unit</span>}
                name="unit"
                rules={[{ required: true, message: "Please select unit" }]}
              >
                <Select
                  size="large"
                  placeholder="Select unit"
                  style={{ width: "100%" }}
                  options={unitOptions.map((unit) => ({
                    label: unit,
                    value: unit,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
              scroll={{ x: 520 }}
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

export default AddSupplyIngredientsModal;
