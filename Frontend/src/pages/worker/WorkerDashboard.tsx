import { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css";
import {
  FaBoxOpen,
  FaDollarSign,
  FaShoppingCart,
  FaTags,
  FaWallet,
} from "react-icons/fa";
import TopSelling from "../../components/worker/WorkerTopSelling";
import TotalRevenue from "../../components/worker/WorkerTotalRevenue";
import MostReservedTablesChart from "../charts/MostReservedTablesChart";
import TopSellingProductsChart from "../charts/TopSellingProductsChart";
import TotalCustomersChart from "../charts/TotalCustomersChart";
import CategoriesModal from "../WorkerModals/CategoriesModal";
import TotalProductsModal from "../WorkerModals/TotalProductsModal";

import { Button, DatePicker, Modal, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { AiOutlineArrowRight } from "react-icons/ai";
import { FiCalendar, FiFilter } from "react-icons/fi";

import WelcomeCard from "./WelcomeCard";
import ShowCard from "./ShowCard";
import { getWorkerDashboardCardData } from "./WorkerDashboardCardData";
import StatCards from "./StatCards";

interface Category {
  categories_id: number;
  categories_name: string;
  categories_img: string;
  status: string;
}

const WorkerDashboard = () => {
  // --- 🔸 States for Filter Modal ---
  const today = dayjs();
  const firstDayOfMonth = today.startOf("month");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs | null>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<Dayjs | null>(today);
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    firstDayOfMonth,
    today,
  ]);

  // --- 🔸 States for Cards and Stats ---
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [changeData, setChangeData] = useState<{
    change: string;
    changeType: "up" | "down";
  }>({ change: "", changeType: "up" });

  const [totalCategories, setTotalCategories] = useState<number | null>(null);
  const [categoriesChangeData, setCategoriesChangeData] = useState<{
    change: string;
    changeType: "up" | "down";
  }>({ change: "", changeType: "up" });

  const [isProductsModalVisible, setIsProductsModalVisible] = useState(false);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] =
    useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  const previousTotalProducts: number = 10;
  const previousTotalCategories: number = 1400;
  const apiUrl = import.meta.env.VITE_API_URL;
  const [fname, setFname] = useState<string>("");
  // --- 🔸 Fetch Data (Products) ---
  useEffect(() => {
    fetch(`${apiUrl}/total_products`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.totalProducts === "number") {
          setTotalProducts(data.totalProducts);
          const current = data.totalProducts;
          const prev = previousTotalProducts;
          let changePercent = ((current - prev) / prev) * 100;
          const type = changePercent >= 0 ? "up" : "down";
          const formattedChange = `${
            type === "up" ? "+" : ""
          }${changePercent.toFixed(1)}%`;
          setChangeData({ change: formattedChange, changeType: type });
        } else {
          setTotalProducts(null);
        }
      })
      .catch(() => {
        setTotalProducts(null);
      });
  }, [dates]); // ✅ refetch when date changes

  // --- 🔸 Fetch Data (Categories) ---
  useEffect(() => {
    fetch(`${apiUrl}/total_categories`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.totalCategories === "number") {
          setTotalCategories(data.totalCategories);
          const current = data.totalCategories;
          const prev = previousTotalCategories;
          let changePercent = ((current - prev) / prev) * 100;
          const type = changePercent >= 0 ? "up" : "down";
          const formattedChange = `${
            type === "up" ? "+" : ""
          }${changePercent.toFixed(1)}%`;
          setCategoriesChangeData({
            change: formattedChange,
            changeType: type,
          });
        } else {
          setTotalCategories(null);
        }
      })
      .catch(() => {
        setTotalCategories(null);
      });
  }, [dates]); // ✅ refetch when date changes

  // --- 🔸 Fetch Data (Categories Modal) ---
  useEffect(() => {
    if (isCategoriesModalVisible) {
      fetch(`${apiUrl}/categories_list`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.categories))
            setCategoriesList(data.categories);
          else setCategoriesList([]);
        })
        .catch(() => setCategoriesList([]));
    }
  }, [isCategoriesModalVisible]);

  useEffect(() => {
    if (!userId) return;

    fetch(`${apiUrl}/get_user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.fname) {
          setFname(data.fname);
        }
      })
      .catch(() => {
        setFname("User");
      });
  }, []);

  // --- 🔸 Filter Handlers ---
  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleApply = () => {
    if (startDate && endDate && startDate.isAfter(endDate)) {
      message.error("Start date cannot be after end date!");
      return;
    }
    setDates([startDate, endDate]);
    setIsModalOpen(false);
  };

  const handleReset = () => {
    const resetStart = dayjs().startOf("month");
    const resetEnd = dayjs();

    setStartDate(resetStart);
    setEndDate(resetEnd);
    setDates([resetStart, resetEnd]);

    setIsModalOpen(false);
  };

  const openProductsModal = () => setIsProductsModalVisible(true);
  const closeProductsModal = () => setIsProductsModalVisible(false);
  const openCategoriesModal = () => setIsCategoriesModalVisible(true);
  const closeCategoriesModal = () => setIsCategoriesModalVisible(false);
  const userId = sessionStorage.getItem("user_id");
  const formattedTotalProducts =
    totalProducts !== null ? `${totalProducts.toLocaleString()}` : "...";
  const formattedTotalCategories =
    totalCategories !== null ? `${totalCategories.toLocaleString()}` : "...";

  const cardData = getWorkerDashboardCardData({
    totalProducts: formattedTotalProducts,
    totalCategories: formattedTotalCategories,
    onProductsClick: openProductsModal,
    onCategoriesClick: openCategoriesModal,
  });

  return (
    <div
      className="space-y-6 
  bg-[#fafafa] dark:bg-[rgb(0,51,102)] text-black dark:text-[#fafafa]
  p-0 rounded-none w-full"
    >
      {/* 🔸 Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        {/* RIGHT SIDE - Filter + Reset (STACK ON MOBILE) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="default"
            onClick={showModal}
            className="flex items-center gap-2 w-full"
          >
            <FiFilter className="text-orange-500" />
            <span className="font-medium">Filter - </span>
            {dates[0]?.format("MMM DD, YYYY")} →{" "}
            {dates[1]?.format("MMM DD, YYYY")}
          </Button>

          <Button className="w-full sm:w-auto" onClick={handleReset}>
            Reset
          </Button>
        </div>
        {/* LEFT SIDE - Title */}

        <Modal
          open={isModalOpen}
          footer={null}
          onCancel={handleCancel}
          centered
        >
          <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
            <FiCalendar className="text-orange-500" />
            <span>Filter by Date</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            <div className="border px-3 py-1 rounded-md">
              {dates[0] ? dates[0].format("MMM DD") : "Start"}
            </div>
            <AiOutlineArrowRight className="text-xl text-gray-500" />
            <div className="border px-3 py-1 rounded-md">
              {dates[1] ? dates[1].format("MMM DD") : "End"}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <label className="block mb-1 text-gray-600 text-sm">
                Start Date
              </label>
              <DatePicker
                value={startDate}
                onChange={(val: Dayjs | null) => {
                  setStartDate(val);
                  setDates([val, endDate]);
                }}
                format="MMM DD, YYYY"
                style={{ width: "100%" }}
              />
            </div>

            <div className="flex-1">
              <label className="block mb-1 text-gray-600 text-sm">
                End Date
              </label>
              <DatePicker
                value={endDate}
                onChange={(val: Dayjs | null) => {
                  setEndDate(val);
                  setDates([startDate, val]);
                }}
                format="MMM DD, YYYY"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 flex-wrap">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </Modal>
      </div>
      <div className="flex flex-col lg:flex-row gap-3 items-stretch">
        {/* LEFT SIDE */}
        <div className="flex-1 min-w-0">
          <WelcomeCard fname={fname} />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 min-w-0">
          <ShowCard />
        </div>
      </div>

      {/* 🔸 Dashboard Statistic Cards */}
      <div className="rounded-2xl bg-gray-50 p-4 sm:p-6 dark:bg-[#1e293b]">
        <StatCards cards={cardData} />
      </div>

      {/* 🔸 Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
        {/* First row */}
        <TopSellingProductsChart />
        <TopSelling />
        {/* Second row */}
        <TotalCustomersChart dates={dates} />
        <MostReservedTablesChart dates={dates} />
      </div>

      {/* 🔸 Revenue Section */}
      <div className="mt-4 w-full">
        <TotalRevenue dates={dates} />
      </div>

      {/* 🔸 Modals */}
      <TotalProductsModal
        open={isProductsModalVisible}
        onClose={closeProductsModal}
        totalProducts={totalProducts}
        change={changeData.change}
      />

      <CategoriesModal
        open={isCategoriesModalVisible}
        onClose={closeCategoriesModal}
        categories={categoriesList}
        totalCategories={totalCategories}
        change={categoriesChangeData.change}
      />
    </div>
  );
};

export default WorkerDashboard;
