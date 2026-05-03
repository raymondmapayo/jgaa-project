import { lazy } from "react";

export const AdminRoutes = [
  {
    path: "/Admin/Dashboard",
    component: lazy(() => import("../pages/admin/Dashboard")),
  },
  {
    path: "/Admin/Manage/Menu",
    component: lazy(() => import("../pages/admin/ManageMenu")),
  },
  {
    path: "/Admin/Manage/Order",
    component: lazy(() => import("../pages/admin/ManageOrder")),
  },

  {
    path: "/Admin/Manage/Reservation",
    component: lazy(() => import("../pages/admin/Reservation")),
  },
  {
    path: "/Admin/Manage/Users",
    component: lazy(() => import("../pages/admin/ManageUser")),
  },

  {
    path: "/Admin/Manage/Inventory",
    component: lazy(() => import("../pages/admin/Tabs/InventoryTabs")),
  },
  {
    path: "/Admin/AnalyticsReports",
    component: lazy(() => import("../pages/admin/AnalyticsInsights")),
  },
  {
    path: "/Admin/Chats",
    component: lazy(() => import("../pages/admin/Chat")),
  },
  {
    path: "/Admin/Manage/Ingredients",
    component: lazy(() => import("../pages/admin/ManageIngredients")),
  },

  {
    path: "/Admin/Manage/Workers",
    component: lazy(() => import("../pages/admin/ManageWorker")),
  },
  {
    path: "/Admin/Announcements",
    component: lazy(() => import("../pages/admin/AdminAnnouncement")),
  },
  {
    path: "/Admin/MyProfile",
    component: lazy(() => import("../components/admin/ProfileAdmin")),
  },
  {
    path: "/Admin/Manage/Inventory",
    component: lazy(() => import("../pages/admin/ManageInventory")),
  },

  {
    path: "/Admin/Manage/Inventory",
    component: lazy(() => import("../pages/admin/Tabs/InventoryTabs")),
  },
  {
    path: "/Admin/Manage/Categories",
    component: lazy(() => import("../pages/admin/Tabs/CategoriesTabs")),
  },
  {
    path: "/Admin/Manage/Supply",
    component: lazy(() => import("../pages/admin/Tabs/SupplyTabs")),
  },
  {
    path: "/Admin/Manage/Ingredients",
    component: lazy(() => import("../pages/admin/Tabs/Drinks&IngredientsTabs")),
  },
  {
    path: "/Admin/Manage/Expenses",
    component: lazy(() => import("../pages/admin/AdminManageExpenses")),
  },
  {
    path: "/Admin/Manage/Sales_Summary",
    component: lazy(() => import("../pages/admin/AdminManageSalesSummary")),
  },
];
