import { Menu } from "antd";
import { useEffect, useState } from "react";
import { LuNotebookPen } from "react-icons/lu";
import { AiOutlineMessage } from "react-icons/ai";
import { RiMenuSearchLine } from "react-icons/ri";
import { MdOutlineInventory } from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { useLocation, useNavigate } from "react-router-dom";
import { StyledSider } from "../../styled/worker";
import { LuChartLine } from "react-icons/lu";
import { TbCategoryPlus } from "react-icons/tb";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const WorkerSidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState<string[]>(["dashboard"]);

  // Load sidebar state from localStorage (default open)
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    } else {
      setCollapsed(false);
    }
  }, [setCollapsed]);

  // Save state when collapsed changes
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <RxDashboard size={25} />,
      children: [
        {
          key: "overview",
          label: "Overview",
          link: "/Worker/Dashboard",
        },
      ],
    },
    {
      key: "menu_management",
      label: "Menu Management",
      icon: <RiMenuSearchLine size={25} />,
      children: [
        {
          key: "menu",
          label: "Menu Items",
          link: "/Worker/Manage/Menu",
        },
        {
          key: "recipe",
          label: "Ingredients & Drinks",
          link: "/Worker/Manage/Ingredients",
        },
      ],
    },
    {
      key: "inventory_supplies",
      label: "Inventory & Supplies",
      icon: <MdOutlineInventory size={25} />,
      children: [
        {
          key: "inventory",
          label: "Inventory & Supplies",
          link: "/Worker/Manage/Inventory",
        },
        {
          key: "supply",
          label: "Supply",
          link: "/Worker/Manage/Supply",
        },
      ],
    },
    {
      key: "orders_reservations",
      label: "Orders & Reservations",
      icon: <LuNotebookPen size={25} />,
      children: [
        {
          key: "orders",
          label: "Orders",
          link: "/Worker/Manage/Order",
        },
        {
          key: "reservation",
          label: "Reservation",
          link: "/Worker/Manage/Reservation",
        },
      ],
    },
    {
      key: "finacial_report",
      label: "Financal Report",
      icon: <LuChartLine size={25} />,
      children: [
        {
          key: "sales_summary",
          label: "Sales Summary",
          link: "/Worker/Manage/Sales_Summary",
        },
        {
          key: "expenses",
          label: "Expenses",
          link: "/Worker/Manage/Expenses",
        },
      ],
    },
    {
      key: "categories",
      label: "Categories",
      icon: <TbCategoryPlus size={25} />,
      link: "/Worker/Manage/Categories",
    },
    {
      key: "chats",
      label: "Manage Chats",
      icon: <AiOutlineMessage size={25} />,
      link: "/Worker/Manage/Chats",
    },
  ];

  // Get the selected sidebar item based on the current URL
  const selectedMenuKey =
    menuItems
      .flatMap((item) => item.children || [item])
      .find((child) => child.link === location.pathname)?.key || "overview";

  // Automatically open the parent menu of the selected child
  const selectedParentKey = menuItems.find((item) =>
    item.children?.some((child) => child.key === selectedMenuKey),
  )?.key;

  useEffect(() => {
    if (selectedParentKey) {
      setOpenKeys((prevKeys) =>
        prevKeys.includes(selectedParentKey)
          ? prevKeys
          : [...prevKeys, selectedParentKey],
      );
    }
  }, [selectedParentKey, location.pathname]);

  return (
    <StyledSider
      $collapsed={collapsed}
      collapsed={collapsed}
      width={270}
      collapsedWidth={window.innerWidth < 768 ? "0" : "80"}
    >
      {/* Header */}
      <div className="sidebar-header">
        {collapsed ? (
          "JGAA"
        ) : (
          <div className="flex items-center gap-4">
            <img
              src="/logo.jpg"
              className="w-12 rounded-full z-50 border"
              alt="Logo"
            />
            <p className="font-bold text-[#fa8c16]">JGAA Food & Drinks</p>
          </div>
        )}
      </div>

      {/* Scrollable Menu */}
      <div className="menu-scroll">
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          onClick={({ key }) => {
            // Search both parent and child items
            const found =
              menuItems.find((item) => item.key === key && item.link) ||
              menuItems
                .flatMap((group) => group.children || [])
                .find((child) => child.key === key);

            if (found && found.link) {
              navigate(found.link);
            }
          }}
          items={menuItems.map((group) => ({
            key: group.key,
            icon: group.icon,
            label: group.label,
            children: group.children
              ? group.children.map((child) => ({
                  key: child.key,
                  label: child.label,
                }))
              : undefined, // Allows single (non-dropdown) items to work
          }))}
        />
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="footer-container">
          <div className="p-2 text-gray-700 text-sm flex flex-col items-center">
            <img
              src="/background.png"
              alt="Restaurant Background"
              className="w-full rounded mb-2"
              style={{ objectFit: "cover", maxHeight: 120 }}
            />
          </div>
          <div className="px-2 text-center text-xs text-gray-500">
            <div className="font-semibold">Designed & Built by Capstone</div>
            <div className="text-gray-400">© 2025, All rights reserved.</div>
          </div>
        </div>
      )}
    </StyledSider>
  );
};

export default WorkerSidebar;
