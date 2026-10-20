import { PlusOutlined } from "@ant-design/icons";
import { Button, Input, Pagination } from "antd";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { BsChevronDown, BsPencilSquare } from "react-icons/bs";
import WorkerIngredientsEditModal from "../WorkerModals/WorkerIngredientsEditModal";
import AddIngredientsModal from "../WorkerModals/AddIngredientsModal";

const { Search } = Input;

interface MenuItem {
  menu_id: number;
  item_name: string;
  menu_img: string;
  description: string;
  categories_name: string;
}

interface Ingredient {
  ingredients_id: number;
  ingredients_name: string;
  measurement: string;
  unit: string;
}

const WorkerManageIngredients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredientsMap, setIngredientsMap] = useState<
    Record<number, Ingredient[]>
  >({});
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingData, setEditingData] = useState<{
    menu_id: number;
    item_name: string;
    ingredients: Ingredient[];
  } | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch menu items
  useEffect(() => {
    axios
      .get(`${apiUrl}/ingredients_items`)
      .then((res) => setMenuItems(res.data))
      .catch((error) => console.error("Error fetching menu items:", error));
  }, []);

  // Fetch ingredients for each menu item using menu_id
  useEffect(() => {
    menuItems.forEach((item) => {
      axios
        .get<Ingredient[]>(`${apiUrl}/ingredients_by_category/${item.menu_id}`)
        .then((res) => {
          setIngredientsMap((prev) => ({
            ...prev,
            [item.menu_id]: res.data,
          }));
        })
        .catch(() => {
          setIngredientsMap((prev) => ({
            ...prev,
            [item.menu_id]: [],
          }));
        });
    });
  }, [menuItems]);

  const filteredItems = menuItems.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  const toggleExpand = (menuId: number) => {
    setExpandedMap((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  return (
    <section className="relative -mx-6 sm:mx-0">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-colors sm:p-8 dark:border-white/10 dark:bg-[#001f3f]">
        {/* Ambient glow + grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0" />

        <div className="relative">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Ingredients
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {menuItems.length} menu items. Open a card to see or edit its
                recipe.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Search
                placeholder="Search menu items..."
                allowClear
                size="large"
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-72"
              />
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                className="  w-full sm:w-auto"
                onClick={() => setIsModalVisible(true)}
              >
                Add ingredients
              </Button>
            </div>
          </motion.header>

          {/* Cards Grid */}
          {paginatedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-slate-800">
                {searchTerm ? "No matching menu items" : "No menu items yet"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm
                  ? "Try a different name, or clear the search."
                  : "Add ingredients to a menu item to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((item, i) => {
                const recipeList = ingredientsMap[item.menu_id] || [];
                const isExpanded = expandedMap[item.menu_id] || false;
                const hasRecipe = recipeList.length > 0;

                return (
                  <motion.article
                    key={item.menu_id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.35 }}
                    className={`flex flex-col self-start overflow-hidden rounded-2xl border bg-white transition-shadow duration-300 ${
                      isExpanded
                        ? "border-orange-300 shadow-[0_16px_40px_rgba(249,115,22,0.18)]"
                        : "border-slate-200 shadow-sm hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                    }`}
                  >
                    <div className="flex items-start gap-4 p-5">
                      <img
                        src={
                          item.menu_img.startsWith("http")
                            ? item.menu_img // Cloudinary URL
                            : `${apiUrl}/uploads/images/${item.menu_img}` // local fallback
                        }
                        alt={item.item_name}
                        className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover ring-2 ring-orange-400 ring-offset-2"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-semibold text-slate-900">
                          {item.item_name}
                        </h2>
                        <span
                          className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            hasRecipe
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {hasRecipe
                            ? `${recipeList.length} ingredient${recipeList.length > 1 ? "s" : ""}`
                            : "No recipe yet"}
                        </span>
                      </div>
                    </div>

                    <p className="line-clamp-3 px-5 pb-4 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>

                    {hasRecipe && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.menu_id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-3 text-sm font-medium text-orange-600 outline-none transition hover:bg-orange-50 focus-visible:ring-4 focus-visible:ring-orange-300/40"
                      >
                        {isExpanded ? "Hide ingredients" : "Show ingredients"}
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <BsChevronDown />
                        </motion.span>
                      </button>
                    )}

                    {/* Ingredients list */}
                    <AnimatePresence initial={false}>
                      {isExpanded && hasRecipe && (
                        <motion.div
                          key="list"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="overflow-hidden"
                        >
                          <ul className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/70 px-5 text-sm">
                            {recipeList.map((ingredient) => (
                              <li
                                key={ingredient.ingredients_id}
                                className="flex items-center justify-between gap-3 py-2.5"
                              >
                                <span className="text-slate-700">
                                  {ingredient.ingredients_name}
                                </span>
                                <span className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                  {ingredient.measurement} {ingredient.unit}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-end border-t border-slate-100 bg-white px-5 py-3">
                            <Button
                              size="middle"
                              icon={<BsPencilSquare />}
                              className="!border-orange-400 !text-orange-600 hover:!bg-orange-50"
                              onClick={() => {
                                setEditingData({
                                  menu_id: item.menu_id,
                                  item_name: item.item_name,
                                  ingredients: recipeList,
                                });
                                setIsEditModalVisible(true);
                              }}
                            >
                              Edit recipe
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-10 flex w-full justify-center">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredItems.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        </div>

        {/* Add Modal */}
        <AddIngredientsModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onIngredientAdded={(newIngredients, categoryName) => {
            const menuItem = menuItems.find(
              (item) => item.item_name === categoryName,
            );
            if (!menuItem) return;

            setIngredientsMap((prev) => ({
              ...prev,
              [menuItem.menu_id]: [
                ...(prev[menuItem.menu_id] || []),
                ...newIngredients,
              ],
            }));
          }}
        />

        {/* Edit Modal */}
        {editingData && (
          <WorkerIngredientsEditModal
            visible={isEditModalVisible}
            onClose={() => setIsEditModalVisible(false)}
            ingredientData={editingData}
            onIngredientsUpdated={(updatedIngredients, menu_id) => {
              setIngredientsMap((prev) => ({
                ...prev,
                [menu_id]: updatedIngredients,
              }));
            }}
          />
        )}
      </div>
    </section>
  );
};

export default WorkerManageIngredients;
