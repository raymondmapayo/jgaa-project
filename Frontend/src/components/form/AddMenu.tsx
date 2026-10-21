/* eslint-disable @typescript-eslint/no-explicit-any */
import { UploadOutlined } from "@ant-design/icons";
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
import React, { useEffect, useState } from "react";

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

  const user_id = sessionStorage.getItem("user_id");

  // Temporary queue for multiple menu items.
  const [menuList, setMenuList] = useState<any[]>([]);
  const [existingMenus, setExistingMenus] = useState<any[]>([]);

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
    }
  };

  // Submit all queued items.
  const handleSubmitAll = async () => {
    if (menuList.length === 0) return;

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
  };

  const columns: ColumnsType<any> = [
    { title: "Menu Name", dataIndex: "item_name" },
    { title: "Category", dataIndex: "categoryName" },
    {
      title: "Unit",
      dataIndex: "unit",
      render: (unit: string, record: any) =>
        isDrinksCategory(record.categories_id) ? unit || "Not selected" : "—",
    },
    {
      title: "Menu Image",
      dataIndex: "menu_img",
      render: (file: File) => {
        if (!file) return null;

        const url = URL.createObjectURL(file);

        return (
          <img
            src={url}
            alt="menu"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
            }}
          />
        );
      },
    },
    { title: "Price", dataIndex: "price" },
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
      title="Add New Menu"
      open={isAddModalVisible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700">
        <strong>Important:</strong> After adding a menu, please go to
        <span className="font-semibold"> Ingredients Management </span>
        and assign ingredients to food menus.
        <br />
        Menus <strong>without ingredients</strong> may not be displayed on the
        client side, depending on your existing menu logic.
      </div>

      <Form
        layout="vertical"
        form={form}
        onValuesChange={(changedValues) => {
          if (changedValues.categories_id !== undefined) {
            handleCategoryChange(changedValues.categories_id);
          }
        }}
      >
        {/* First Row: Menu Name and Category */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Menu Name"
              name="item_name"
              rules={[
                {
                  required: true,
                  message: "Menu name is required",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Category"
              name="categories_id"
              rules={[
                {
                  required: true,
                  message: "Category is required",
                },
              ]}
            >
              <Select
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
          <Form.Item
            label="Drink Unit"
            name="unit"
            rules={[
              {
                required: true,
                message: "Please select the drink unit",
              },
            ]}
          >
            <Select placeholder="Select drink unit">
              <Select.Option value="liters">Liters</Select.Option>
              <Select.Option value="ml">Milliliters (ml)</Select.Option>
              <Select.Option value="kg">Kilograms (kg)</Select.Option>
              <Select.Option value="bottle">Bottle</Select.Option>
              <Select.Option value="can">Can</Select.Option>
              <Select.Option value="piece">Piece</Select.Option>
            </Select>
          </Form.Item>
        )}

        {/* Second Row: Price and Image */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Price"
              name="price"
              rules={[
                {
                  required: true,
                  message: "Price is required",
                },
              ]}
            >
              <Input type="number" min={0} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Menu Image"
              name="menu_img"
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
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
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        {/* Third Row: Description */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        {/* Form Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            onClick={() => {
              form.resetFields();
              setSelectedCategory(null);
            }}
          >
            Clear
          </Button>

          <Button
            onClick={() => {
              form
                .validateFields()
                .then((values) => handleSubmitOne(values))
                .catch(() => {});
            }}
          >
            Add One
          </Button>

          <Button
            type="primary"
            onClick={() => {
              form
                .validateFields()
                .then((values) => handleAddToList(values))
                .catch(() => {});
            }}
          >
            Add to List
          </Button>
        </div>
      </Form>

      {/* Queue Table */}
      {menuList.length > 0 && (
        <>
          <Table
            dataSource={menuList}
            columns={columns}
            rowKey={(_, index) => index!.toString()}
            pagination={false}
            scroll={{ x: 800 }}
            size="small"
          />

          <div className="flex justify-end mt-3">
            <Button type="primary" onClick={handleSubmitAll}>
              Insert All
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default AddMenuForm;
