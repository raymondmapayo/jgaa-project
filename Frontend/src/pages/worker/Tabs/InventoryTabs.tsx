import { Tabs } from "antd";
import WorkerManageIngredientsInventory from "../WorkerManageIngredientsInventory";
import WorkerManageDrinksInventory from "../WorkerManageDrinksInventory";

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
                <WorkerManageIngredientsInventory />
              </div>
            ),
          },
          {
            key: "2",
            label: "Drinks",
            children: (
              <div className="mt-4">
                <WorkerManageDrinksInventory />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default InventoryTabs;
