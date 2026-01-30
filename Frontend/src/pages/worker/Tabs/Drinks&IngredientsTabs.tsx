import { Tabs } from "antd";
import WorkerManageIngredients from "../WorkerManageIngredients";
import WorkerManageDrinks from "../WorkerManageDrinks";

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
                <WorkerManageIngredients />
              </div>
            ),
          },
          {
            key: "2",
            label: "Drinks",
            children: (
              <div className="mt-4">
                <WorkerManageDrinks />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default InventoryTabs;
