import { Tabs } from "antd";
import AdminManageIngredientsSupply from "../AdminManageIngredientsSupply";
import AdminManageDrinksSupply from "../AdminManageDrinksSupply";

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
                <AdminManageIngredientsSupply />
              </div>
            ),
          },
          {
            key: "2",
            label: "Drinks",
            children: (
              <div className="mt-4">
                <AdminManageDrinksSupply />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default InventoryTabs;
