import { Tabs } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import WorkerManageSupplyCategories from "../WorkerManageSupplyCategories";
import WorkerManageCategories from "../WorkerManageCategories";
import WorkerManageExpensesCategory from "../WorkerManageExpensesCategory";
import WorkerManageExpensesSubCategory from "../WorkerManageExpensesSubCategory";
import { useState } from "react";

const CategoriesTabs = () => {
  const [activeKey, setActiveKey] = useState("1");
  return (
    <div className="w-full h-full">
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key)} // 👈 closes dropdown
        size="large"
        moreIcon={<MoreOutlined />}
        tabBarGutter={24}
        items={[
          {
            key: "1",
            label: "Menus Categories",
            children: (
              <div className="mt-4">
                <WorkerManageCategories />
              </div>
            ),
          },
          {
            key: "2",
            label: "Supply Categories",
            children: (
              <div className="mt-4">
                <WorkerManageSupplyCategories />
              </div>
            ),
          },
          {
            key: "3",
            label: "Expense Categories",
            children: (
              <div className="mt-4">
                <WorkerManageExpensesCategory />
              </div>
            ),
          },
          {
            key: "4",
            label: "Expense SubCategories",
            children: (
              <div className="mt-4">
                <WorkerManageExpensesSubCategory />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CategoriesTabs;
