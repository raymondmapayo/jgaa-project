import {
  FaBoxOpen,
  FaDollarSign,
  FaShoppingCart,
  FaTags,
  FaWallet,
} from "react-icons/fa";

interface DashboardCardDataProps {
  totalProducts: string;
  totalCategories: string;
  onProductsClick: () => void;
  onCategoriesClick: () => void;
}

export const getWorkerDashboardCardData = ({
  totalProducts,
  totalCategories,
  onProductsClick,
  onCategoriesClick,
}: DashboardCardDataProps) => [
  {
    title: "Total Products",
    value: totalProducts,
    icon: <FaBoxOpen size={20} />,
    color: "text-blue-500",
    onClick: onProductsClick,
  },
  {
    title: "Total Categories",
    value: totalCategories,
    icon: <FaTags size={20} />,
    color: "text-red-500",
    onClick: onCategoriesClick,
  },
  {
    title: "Total Sales",
    value: "$18,645",
    icon: <FaShoppingCart size={20} />,
    color: "text-purple-500",
  },
  {
    title: "Total Revenue",
    value: "$34,876",
    icon: <FaDollarSign size={20} />,
    color: "text-green-500",
  },
  {
    title: "Total Expenses",
    value: "$73,579",
    icon: <FaWallet size={20} />,
    color: "text-yellow-500",
  },
];
