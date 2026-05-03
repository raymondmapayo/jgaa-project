import { Tabs } from "antd";
import AdminManageIngredients from "../ManageIngredients";

//import AdminManageDrinks from "../AdminManageDrinks";

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
                <AdminManageIngredients />
              </div>
            ),
          },
          // {
          //   key: "2",
          //   label: "Drinks",
          //   children: (
          //     <div className="mt-4">
          //       <AdminManageDrinks />
          //     </div>
          //   ),
          // },
        ]}
      />
    </div>
  );
};

export default InventoryTabs;
