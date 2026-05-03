import React, { useState, useEffect } from "react";
import { DatePicker, Button, Modal, message } from "antd";
import { AiOutlineArrowRight } from "react-icons/ai";
import { FiCalendar, FiFilter } from "react-icons/fi";
import dayjs, { Dayjs } from "dayjs";

interface SalesSummaryFilterModalProps {
  dates: [Dayjs | null, Dayjs | null];
  setDates: (start: Dayjs | null, end: Dayjs | null) => void;
}

const SalesSummaryFilterModal: React.FC<SalesSummaryFilterModalProps> = ({
  dates,
  setDates,
}) => {
  const today = dayjs();
  const firstDayOfMonth = today.startOf("month");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs | null>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<Dayjs | null>(today);

  useEffect(() => {
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  }, [dates]);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleApply = () => {
    if (startDate && endDate && startDate.isAfter(endDate)) {
      message.error("Start date cannot be after end date!");
      return;
    }
    setDates(startDate, endDate); // <-- only trigger fetch here
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-[rgb(0,51,102)] text-black dark:text-white p-0 rounded-none w-full">
      {/* Unified Filter Modal Button */}
      <Button
        type="default"
        onClick={showModal}
        className="flex items-center gap-2"
      >
        <FiFilter className="text-orange-500" />
        <span className="font-medium">Filter - </span>
        {dates[0]?.format("MMM DD, YYYY")} → {dates[1]?.format("MMM DD, YYYY")}
      </Button>

      {/* Modal */}
      <Modal open={isModalOpen} footer={null} onCancel={handleCancel} centered>
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
              onChange={(val: Dayjs | null) => setStartDate(val)} // <-- local only
              format="MMM DD, YYYY"
              style={{ width: "100%" }}
            />
          </div>

          <div className="flex-1">
            <label className="block mb-1 text-gray-600 text-sm">End Date</label>
            <DatePicker
              value={endDate}
              onChange={(val: Dayjs | null) => setEndDate(val)} // <-- local only
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
  );
};

export default SalesSummaryFilterModal;
