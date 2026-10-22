import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, message, Modal, Row, Select } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import SupplyReminderModal from "../../terms_policy/SupplyReminderModal";

interface AddIngredientsModalProps {
  visible: boolean;
  onClose: () => void;
  onIngredientAdded?: (newIngredients: any[], category: string) => void;
}

interface MenuItem {
  menu_id: number;
  item_name: string;
}

interface SupplyIngredient {
  ingredients_name: string;
  unit: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const AddIngredientsModal: React.FC<AddIngredientsModalProps> = ({
  visible,
  onClose,
  onIngredientAdded,
}) => {
  const [form] = Form.useForm();

  const [categories, setCategories] = useState<MenuItem[]>([]);
  const [showSupplyReminder, setShowSupplyReminder] = useState(false);

  const [supplyIngredients, setSupplyIngredients] = useState<
    SupplyIngredient[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);

  const user_id = sessionStorage.getItem("user_id");

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const [categoryRes, ingredientRes] = await Promise.all([
          axios.get(`${apiUrl}/ingredients_items`),
          axios.get(`${apiUrl}/get_supply_ingredients_dropdown`),
        ]);

        if (!isMounted) return;

        setCategories(categoryRes.data);

        if (ingredientRes.data.success) {
          const fetchedIngredients: SupplyIngredient[] =
            ingredientRes.data.ingredients || [];

          setSupplyIngredients(fetchedIngredients);

          if (fetchedIngredients.length === 0) {
            // Isira ang Add Ingredient modal una.
            onClose();

            // Ipakita ang reminder human ma-close ang form.
            setShowSupplyReminder(true);
          } else {
            setShowSupplyReminder(false);
          }
        } else {
          setSupplyIngredients([]);
          onClose();
          setShowSupplyReminder(true);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("Error fetching ingredient data:", error);
        message.error("Failed to load ingredient data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleAddIngredient = async (values: any) => {
    try {
      const addedIngredients = [];

      for (const ing of values.ingredients) {
        const res = await axios.post(`${apiUrl}/add_ingredients`, {
          ingredients_name: ing.name,
          measurement: ing.measurement,
          unit: ing.unit,
          category: values.category,
          created_by: user_id,
        });

        addedIngredients.push(res.data.ingredient);
      }

      message.success("Ingredients added successfully!");
      form.resetFields();

      if (onIngredientAdded) {
        onIngredientAdded(addedIngredients, values.category);
      }

      onClose();
    } catch (error) {
      console.error("Error adding ingredients:", error);
      message.error("Failed to add ingredients.");
    }
  };

  return (
    <>
      <Modal
        title="Add Ingredient"
        open={visible && !showSupplyReminder && supplyIngredients.length > 0}
        onCancel={() => {
          form.resetFields();
          onClose();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 650 }}
      >
        <Form
          form={form}
          onFinish={handleAddIngredient}
          layout="vertical"
          initialValues={{
            ingredients: [{ name: "", measurement: "", unit: "" }],
          }}
        >
          {/* Food Name / Category */}
          <Form.Item
            label="Food Name"
            name="category"
            rules={[
              {
                required: true,
                message: "Please select a category",
              },
            ]}
          >
            <Select
              placeholder="Select Food Name"
              style={{ width: "100%" }}
              loading={isLoading}
              options={categories.map((cat) => ({
                label: cat.item_name,
                value: cat.item_name,
              }))}
            />
          </Form.Item>

          {/* Dynamic Ingredient List */}
          <Form.List name="ingredients">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row
                    key={key}
                    gutter={[16, 8]}
                    align="middle"
                    style={{ marginBottom: 8 }}
                  >
                    {/* Ingredient Name Dropdown */}
                    <Col xs={24} sm={24} md={8}>
                      <Form.Item
                        {...restField}
                        label={index === 0 ? "Ingredient Name" : ""}
                        name={[name, "name"]}
                        rules={[
                          {
                            required: true,
                            message: "Please select an ingredient",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          showSearch
                          placeholder="Select ingredient"
                          loading={isLoading}
                          optionFilterProp="label"
                          options={supplyIngredients.map((ingredient) => ({
                            label: ingredient.ingredients_name,
                            value: ingredient.ingredients_name,
                          }))}
                          onChange={(selectedName) => {
                            const selectedIngredient = supplyIngredients.find(
                              (ingredient) =>
                                ingredient.ingredients_name === selectedName,
                            );

                            // Automatically set the saved unit
                            form.setFieldValue(
                              ["ingredients", name, "unit"],
                              selectedIngredient?.unit || "",
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>

                    {/* Measurement */}
                    <Col xs={24} sm={12} md={7}>
                      <Form.Item
                        {...restField}
                        label={index === 0 ? "Measurement" : ""}
                        name={[name, "measurement"]}
                        rules={[
                          {
                            required: true,
                            message: "Enter measurement",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="e.g., 1, 1/2, 1/4, pinch"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>

                    {/* Unit fetched from supply_tbl */}
                    <Col xs={24} sm={12} md={7}>
                      <Form.Item
                        {...restField}
                        label={index === 0 ? "Unit" : ""}
                        name={[name, "unit"]}
                        rules={[
                          {
                            required: true,
                            message: "Unit is required",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Auto-filled unit"
                          readOnly
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>

                    {/* Remove Ingredient */}
                    <Col
                      xs={24}
                      sm={24}
                      md={2}
                      className="flex justify-center mt-2 md:mt-0"
                    >
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          className="text-red-500 text-lg"
                          onClick={() => remove(name)}
                        />
                      )}
                    </Col>
                  </Row>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ name: "", measurement: "", unit: "" })}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add More Ingredient
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="bg-orange-500 hover:!bg-orange-600"
            >
              Add Ingredient(s)
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reminder modal when Ingredient Name dropdown is empty */}

      <SupplyReminderModal
        open={showSupplyReminder}
        onClose={() => setShowSupplyReminder(false)}
        onContinue={() => setShowSupplyReminder(false)}
      />
    </>
  );
};

export default AddIngredientsModal;
