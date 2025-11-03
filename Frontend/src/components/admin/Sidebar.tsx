import { Menu } from "antd";
import { useEffect } from "react";
import { FaReceipt, FaUsersGear } from "react-icons/fa6";
import { MdAnnouncement, MdInventory2, MdMenuBook } from "react-icons/md";
import { RiDashboardFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { StyledSider } from "../../styled/worker";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

// ✅ Define menu item type so TS knows children items have links
type MenuGroup = {
  key: string;
  label: string;
  icon: React.ReactNode;
  children: { key: string; label: string; link: string }[];
};

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const navigate = useNavigate();

  // Load sidebar state from localStorage
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

  const menuItems: MenuGroup[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <RiDashboardFill size={25} />,
      children: [
        {
          key: "overview",
          label: "Overview",
          link: "/Admin/Dashboard",
        },
      ],
    },
    {
      key: "menu_management",
      label: "Menu Management",
      icon: <MdMenuBook size={25} />,
      children: [
        {
          key: "menu",
          label: "Menu Items",
          link: "/Admin/Manage/Menu",
        },
        {
          key: "categories",
          label: "Categories",
          link: "/Admin/Manage/Categories",
        },
        {
          key: "recipe",
          label: "Ingredients",
          link: "/Admin/Manage/Ingredients",
        },
      ],
    },
    {
      key: "inventory_supplies",
      label: "Inventory & Supplies",
      icon: <MdInventory2 size={25} />,
      children: [
        {
          key: "inventory",
          label: "Inventory & Supplies",
          link: "/Admin/Manage/Inventory",
        },
        {
          key: "supply_categories",
          label: "Supply Categories",
          link: "/Admin/Manage/SupplyCategories",
        },
        {
          key: "supply",
          label: "Supply",
          link: "/Admin/Manage/Supply",
        },
      ],
    },
    {
      key: "orders_reservations",
      label: "Orders & Reservations",
      icon: <FaReceipt size={25} />,
      children: [
        {
          key: "orders",
          label: "Orders",
          link: "/Admin/Manage/Order",
        },
        {
          key: "reservation",
          label: "Reservation",
          link: "/Admin/Manage/Reservation",
        },
      ],
    },
    {
      key: "manage_users",
      label: "Manage Users",
      icon: <FaUsersGear size={25} />,
      children: [
        {
          key: "users",
          label: "Clients",
          link: "/Admin/Manage/Users",
        },
        {
          key: "workers",
          label: "Workers",
          link: "/Admin/Manage/Workers",
        },
      ],
    },
    {
      key: "chats_announcements",
      label: "Chats & Announcements",
      icon: <MdAnnouncement size={25} />,
      children: [
        {
          key: "workers_management",
          label: "Workers Management",
          link: "/Admin/Manage/Workers",
        },
        {
          key: "announcements",
          label: "Announcements",
          link: "/Admin/Announcements",
        },
      ],
    },
  ];

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
          defaultOpenKeys={["dashboard"]}
          defaultSelectedKeys={[
            menuItems
              .flatMap((item) => item.children)
              .find((child) => child.link === window.location.pathname)?.key ||
              "overview",
          ]}
          onClick={({ key }) => {
            const found = menuItems
              .flatMap((group) => group.children)
              .find((child) => child.key === key);

            if (found) navigate(found.link);
          }}
          items={menuItems.map((group) => ({
            key: group.key,
            icon: group.icon,
            label: group.label,
            children: group.children.map((child) => ({
              key: child.key,
              label: child.label,
            })),
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

export default Sidebar;
