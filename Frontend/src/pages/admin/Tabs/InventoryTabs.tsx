import { Tabs } from "antd";
import AdminManageIngredientsInventory from "../ManageInventory";
import AdminManageDrinksInventory from "../AdminManageDrinksInventory";

const InventoryTabs = () => {
  return (
    <div className="w-full h-full">
      <Tabs
        defaultActiveKey="1"
        size="large" // removed centered so labels go left
        items={[
          {
            key: "1",
            label: "Ingredients",
            children: (
              <div className="mt-4">
                <AdminManageIngredientsInventory />
              </div>
            ),
          },
          {
            key: "2",
            label: "Drinks",
            children: (
              <div className="mt-4">
                <AdminManageDrinksInventory />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default InventoryTabs;
