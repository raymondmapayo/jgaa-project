import { Tabs } from "antd";

import WorkerManageIngredientsSupply from "../WorkerManageIngredientsSupply";
import WorkerManageDrinksSupply from "../WorkerManageDrinksSupply";

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
                <WorkerManageIngredientsSupply />
              </div>
            ),
          },
          {
            key: "2",
            label: "Drinks",
            children: (
              <div className="mt-4">
                <WorkerManageDrinksSupply />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default InventoryTabs;
