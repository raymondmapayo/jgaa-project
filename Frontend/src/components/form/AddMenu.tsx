/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InfoCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Table,
  Upload,
  notification,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

interface AddMenuFormProps {
  isAddModalVisible: boolean;
  onClose: () => void;
  onAddMenu: (values: any) => void;
}

const AddMenuForm: React.FC<AddMenuFormProps> = ({
  isAddModalVisible,
  onClose,
  onAddMenu,
}) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    string | number | null
  >(null);
  const [submitting, setSubmitting] = useState<"one" | "all" | null>(null);

  const user_id = sessionStorage.getItem("user_id");

  // Temporary queue for multiple menu items.
  const [menuList, setMenuList] = useState<any[]>([]);
  const [existingMenus, setExistingMenus] = useState<any[]>([]);

  // Keeps one preview URL per queued file (avoids creating a new one every render)
  const previewUrls = useRef(new WeakMap<File, string>());
  const getPreviewUrl = (file: File) => {
    let url = previewUrls.current.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      previewUrls.current.set(file, url);
    }
    return url;
  };

  const apiUrl = import.meta.env.VITE_API_URL;

  // Check whether the selected category is Drinks.
  const isDrinksCategory = (categoryId: string | number | null) => {
    if (categoryId === null || categoryId === undefined) return false;

    const category = categories.find(
      (c) => String(c.categories_id) === String(categoryId),
    );

    return (
      String(category?.categories_name || "")
        .trim()
        .toLowerCase() === "drinks"
    );
  };

  const normalizeName = (name: string) =>
    String(name || "")
      .trim()
      .toLowerCase();

  const normalizeUnit = (unit: string) =>
    String(unit || "")
      .trim()
      .toLowerCase();

  // Fetch categories and existing menus.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, menuRes] = await Promise.all([
          axios.get(`${apiUrl}/categories`),
          axios.get(`${apiUrl}/menu_items`),
        ]);

        setCategories(catRes.data);
        setExistingMenus(menuRes.data);
      } catch (error: unknown) {
        console.error("Error fetching data:", error);

        notification.error({
          message: "Error",
          description: "Failed to fetch categories or menus. Please try again.",
        });
      }
    };

    if (isAddModalVisible) {
      fetchData();
    }
  }, [isAddModalVisible, apiUrl]);

  // Reset the unit when changing category.
  const handleCategoryChange = (value: string | number) => {
    setSelectedCategory(value);

    form.setFieldsValue({
      categories_id: value,
      unit: undefined,
    });
  };

  // Check duplicates.
  // Drinks with different units can have separate menu records.
  // Non-drinks retain the original duplicate-name restriction.
  const isDuplicateMenu = (values: any, queuedMenus: any[] = []) => {
    const drinks = isDrinksCategory(values.categories_id);
    const name = normalizeName(values.item_name);
    const unit = normalizeUnit(values.unit);

    const matches = (menu: any) => {
      if (normalizeName(menu.item_name) !== name) return false;

      const existingCategory = String(
        menu.categories_id ?? menu.category_id ?? "",
      );

      const selectedCategoryId = String(values.categories_id ?? "");

      const sameCategory =
        existingCategory === selectedCategoryId ||
        normalizeName(menu.categories_name || menu.categoryName) ===
          normalizeName(
            categories.find(
              (c) => String(c.categories_id) === selectedCategoryId,
            )?.categories_name || "",
          );

      if (!sameCategory) return false;

      if (!drinks) return true;

      // Existing menu records without a unit cannot be safely
      // treated as a different unit.
      if (!menu.unit) return true;

      return normalizeUnit(menu.unit) === unit;
    };

    return existingMenus.some(matches) || queuedMenus.some(matches);
  };

  // Build the request body used by Add One and Insert All.
  const createMenuFormData = (item: any, file: File) => {
    const formData = new FormData();

    formData.append("item_name", item.item_name);
    formData.append("price", String(item.price));
    formData.append("description", item.description || "");
    formData.append("categories_id", String(item.categories_id));
    formData.append("created_by", user_id || "");
    formData.append("menu_img", file);

    // Only send a unit for Drinks.
    if (isDrinksCategory(item.categories_id)) {
      formData.append("unit", item.unit);
    }

    return formData;
  };

  // Add to queue instead of submitting directly.
  const handleAddToList = (values: any) => {
    const file = values.menu_img?.[0]?.originFileObj;

    if (!file) {
      notification.error({
        message: "Error",
        description: "Menu image is required.",
      });
      return;
    }

    if (isDrinksCategory(values.categories_id) && !values.unit) {
      notification.error({
        message: "Unit Required",
        description: "Please select a unit for this drink.",
      });
      return;
    }

    if (isDuplicateMenu(values, menuList)) {
      notification.error({
        message: "Duplicate Menu",
        description: isDrinksCategory(values.categories_id)
          ? `The menu "${values.item_name}" with this unit already exists or is in your queue.`
          : `"${values.item_name}" already exists in the database or queue.`,
      });
      return;
    }

    const newItem = {
      ...values,
      menu_img: file,
      categoryName:
        categories.find(
          (c) => String(c.categories_id) === String(values.categories_id),
        )?.categories_name || "",
    };

    setMenuList((previous) => [...previous, newItem]);

    form.resetFields();
    setSelectedCategory(null);
  };

  // Remove an item from the queue.
  const handleRemoveFromList = (index: number) => {
    setMenuList((previous) => previous.filter((_, i) => i !== index));
  };

  // Submit one item immediately.
  const handleSubmitOne = async (values: any) => {
    try {
      const file = values.menu_img?.[0]?.originFileObj;

      if (!file) {
        notification.error({
          message: "Error",
          description: "Menu image is required.",
        });
        return;
      }

      if (isDrinksCategory(values.categories_id) && !values.unit) {
        notification.error({
          message: "Unit Required",
          description: "Please select a unit for this drink.",
        });
        return;
      }

      if (isDuplicateMenu(values)) {
        notification.error({
          message: "Duplicate Menu",
          description: isDrinksCategory(values.categories_id)
            ? `The menu "${values.item_name}" with this unit already exists.`
            : `"${values.item_name}" already exists in the database.`,
        });
        return;
      }

      setSubmitting("one");

      const formData = createMenuFormData(values, file);

      console.log("Submitting menu...", {
        item_name: values.item_name,
        price: values.price,
        description: values.description,
        categories_id: values.categories_id,
        unit: isDrinksCategory(values.categories_id) ? values.unit : undefined,
        created_by: user_id,
        file: file.name,
      });

      const response = await axios.post(`${apiUrl}/add_menu`, formData);

      console.log("ADD MENU RESPONSE:", response.data);

      notification.success({
        message: "Menu Added Successfully",
        description: isDrinksCategory(values.categories_id)
          ? `Menu added with unit: ${values.unit}.`
          : "Menu has been added.",
        duration: 6,
      });

      form.resetFields();
      setSelectedCategory(null);

      onAddMenu(response.data);

      const menuRes = await axios.get(`${apiUrl}/menu_items`);
      setExistingMenus(menuRes.data);
    } catch (error: any) {
      console.error("ADD MENU ERROR:", error);

      if (error.response) {
        console.error("STATUS:", error.response.status);
        console.error("DATA:", error.response.data);

        notification.error({
          message: "Failed to Add Menu",
          description:
            error.response.data?.error ||
            error.response.data?.message ||
            `Server error: ${error.response.status}`,
        });
      } else if (error.request) {
        console.error("No response from server:", error.request);

        notification.error({
          message: "Server Error",
          description: "The server did not respond.",
        });
      } else {
        notification.error({
          message: "Error",
          description: error.message || "Failed to add menu.",
        });
      }
    } finally {
      setSubmitting(null);
    }
  };

  // Submit all queued items.
  const handleSubmitAll = async () => {
    if (menuList.length === 0) return;

    setSubmitting("all");

    let successCount = 0;
    let failedCount = 0;

    for (const item of menuList) {
      try {
        if (isDrinksCategory(item.categories_id) && !item.unit) {
          throw new Error(`Please select a unit for ${item.item_name}.`);
        }

        const formData = createMenuFormData(item, item.menu_img);

        const response = await axios.post(`${apiUrl}/add_menu`, formData);

        onAddMenu(response.data);
        successCount++;
      } catch (error: any) {
        failedCount++;

        console.error(`Error adding menu "${item.item_name}":`, error);
      }
    }

    if (successCount > 0) {
      const menuRes = await axios.get(`${apiUrl}/menu_items`);
      setExistingMenus(menuRes.data);
    }

    if (failedCount === 0) {
      notification.success({
        message: "Menus Added",
        description: "All queued menu items were added successfully!",
      });

      setMenuList([]);
      form.resetFields();
      setSelectedCategory(null);
      onClose();
    } else {
      notification.warning({
        message: "Some Menus Failed",
        description: `${successCount} menu(s) added, ${failedCount} failed. Check the browser console and server logs. Successful items will not be submitted again automatically.`,
        duration: 8,
      });

      // Keep failed items in the queue to allow retrying.
      // Successfully submitted items are removed.
      const currentNames = new Set(
        existingMenus.map(
          (menu) =>
            `${normalizeName(menu.item_name)}::${normalizeUnit(menu.unit || "")}`,
        ),
      );

      setMenuList((previous) =>
        previous.filter((item) => {
          const key = `${normalizeName(item.item_name)}::${normalizeUnit(item.unit || "")}`;
          return !currentNames.has(key);
        }),
      );
    }

    setSubmitting(null);
  };

  const columns: ColumnsType<any> = [
    {
      title: "Menu",
      dataIndex: "item_name",
      render: (name: string, record: any) => (
        <div className="flex min-w-[200px] items-center gap-3">
          {record.menu_img && (
            <img
              src={getPreviewUrl(record.menu_img)}
              alt={name}
              className="h-12 w-12 flex-shrink-0 rounded-xl object-cover shadow-sm ring-2 ring-white"
            />
          )}
          <span className="font-semibold text-gray-900">{name}</span>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      render: (text: string) => (
        <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {text}
        </span>
      ),
    },
    {
      title: "Unit",
      dataIndex: "unit",
      render: (unit: string, record: any) =>
        isDrinksCategory(record.categories_id) ? unit || "Not selected" : "—",
    },
    {
      title: "Price",
      dataIndex: "price",
      render: (price: any) => (
        <span className="whitespace-nowrap font-bold text-gray-900">
          ₱{Number(price).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Action",
      render: (_: any, _record: any, index: number) => (
        <Button danger size="small" onClick={() => handleRemoveFromList(index)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={isAddModalVisible}
      onCancel={onClose}
      footer={null}
      width={680}
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
              Add new menu
            </h2>
            <p className="m-0 mt-0.5 text-sm text-gray-500">
              Add one menu now, or queue several and insert them together.
            </p>
          </div>
        </div>
      </div>

      {/* ================= Body (scrolls if tall) ================= */}
      <div className="max-h-[72vh] overflow-y-auto bg-white px-6 pb-6 pt-5 sm:px-8">
        {/* Important note */}
        <div className="mb-5 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <InfoCircleOutlined className="mt-0.5 flex-shrink-0 text-base text-blue-600" />
          <p className="m-0 leading-relaxed">
            <strong>Important:</strong> After adding a menu, go to{" "}
            <span className="font-semibold">Ingredients Management</span> and
            assign ingredients to food menus. Menus{" "}
            <strong>without ingredients</strong> may not be displayed on the
            client side, depending on your existing menu logic.
          </p>
        </div>

        <Form
          layout="vertical"
          form={form}
          requiredMark={false}
          onValuesChange={(changedValues) => {
            if (changedValues.categories_id !== undefined) {
              handleCategoryChange(changedValues.categories_id);
            }
          }}
        >
          {/* Menu Name and Category */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Menu name</span>}
                name="item_name"
                rules={[
                  {
                    required: true,
                    message: "Menu name is required",
                  },
                ]}
              >
                <Input size="large" className="rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Category</span>}
                name="categories_id"
                rules={[
                  {
                    required: true,
                    message: "Category is required",
                  },
                ]}
              >
                <Select
                  size="large"
                  placeholder="Select a category"
                  optionLabelProp="label"
                  onChange={(value) => {
                    setSelectedCategory(value);
                    form.setFieldsValue({ unit: undefined });
                  }}
                >
                  {categories.map((category: any) => (
                    <Select.Option
                      key={category.categories_id}
                      value={category.categories_id}
                      label={category.categories_name}
                    >
                      <Radio
                        checked={
                          String(selectedCategory) ===
                          String(category.categories_id)
                        }
                        style={{
                          pointerEvents: "none",
                          marginRight: 8,
                        }}
                      />
                      {category.categories_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Unit: only shown for Drinks */}
          {isDrinksCategory(selectedCategory) && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <Form.Item
                label={<span className="font-semibold">Drink unit</span>}
                name="unit"
                extra="Drinks need a unit so different sizes can be saved separately."
                style={{ marginBottom: 0 }}
                rules={[
                  {
                    required: true,
                    message: "Please select the drink unit",
                  },
                ]}
              >
                <Select size="large" placeholder="Select drink unit">
                  <Select.Option value="liters">Liters</Select.Option>
                  <Select.Option value="ml">Milliliters (ml)</Select.Option>
                  <Select.Option value="kg">Kilograms (kg)</Select.Option>
                  <Select.Option value="bottle">Bottle</Select.Option>
                  <Select.Option value="can">Can</Select.Option>
                  <Select.Option value="piece">Piece</Select.Option>
                </Select>
              </Form.Item>
            </div>
          )}

          {/* Price and Image */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Price</span>}
                name="price"
                rules={[
                  {
                    required: true,
                    message: "Price is required",
                  },
                ]}
              >
                <Input
                  size="large"
                  type="number"
                  min={0}
                  prefix="₱"
                  className="rounded-xl"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span className="font-semibold">Menu image</span>}
                name="menu_img"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList}
                extra="PNG, JPG or JPEG"
                rules={[
                  {
                    required: true,
                    message: "Menu image is required",
                  },
                ]}
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

                    return false;
                  }}
                  maxCount={1}
                  listType="picture"
                >
                  <Button size="large" icon={<UploadOutlined />} block>
                    Upload image
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          {/* Description */}
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

          {/* Form buttons */}
          <div className="border-t border-dashed border-gray-200 pt-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                size="large"
                onClick={() => {
                  form.resetFields();
                  setSelectedCategory(null);
                }}
              >
                Clear
              </Button>

              <Button
                size="large"
                loading={submitting === "one"}
                disabled={submitting === "all"}
                onClick={() => {
                  form
                    .validateFields()
                    .then((values) => handleSubmitOne(values))
                    .catch(() => {});
                }}
              >
                Add one
              </Button>

              <Button
                size="large"
                type="primary"
                icon={<PlusOutlined />}
                disabled={submitting !== null}
                onClick={() => {
                  form
                    .validateFields()
                    .then((values) => handleAddToList(values))
                    .catch(() => {});
                }}
              >
                Add to list
              </Button>
            </div>

            <p className="m-0 mt-3 text-xs text-gray-500 sm:text-right">
              <strong>Add one</strong> saves it right away.{" "}
              <strong>Add to list</strong> queues it so you can insert several
              menus at once.
            </p>
          </div>
        </Form>

        {/* Queue */}
        {menuList.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-base font-bold text-gray-900">
                Queued menus
              </h3>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                {menuList.length}
              </span>
            </div>

            <Table
              dataSource={menuList}
              columns={columns}
              rowKey={(_, index) => index!.toString()}
              pagination={false}
              scroll={{ x: 640 }}
              size="small"
            />

            <div className="mt-4 flex justify-end">
              <Button
                size="large"
                type="primary"
                loading={submitting === "all"}
                disabled={submitting === "one"}
                onClick={handleSubmitAll}
              >
                Insert all ({menuList.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddMenuForm;
