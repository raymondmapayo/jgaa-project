// components/ViewDetailsModal.tsx
import { Button, Modal, Tag, Divider } from "antd";
import React from "react";
import { InfoCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface ViewDetailsModalProps {
  isVisible: boolean;
  selectedItem: any;
  onClose: () => void;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({
  isVisible,
  selectedItem,
  onClose,
}) => {
  if (!selectedItem) return null;

  const isAvailable = selectedItem.availability === "Available";

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      width={520}
      title={
        <div className="flex items-center gap-2 text-lg font-semibold">
          <InfoCircleOutlined className="text-[#fa8c16]" />
          Food Details
        </div>
      }
    >
      <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedItem.item_name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedItem.categories_name}
            </p>
          </div>

          <Tag
            color={isAvailable ? "green" : "red"}
            className="text-xs px-3 py-1"
          >
            {selectedItem.availability}
          </Tag>
        </div>

        {/* Created At */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CalendarOutlined />
          <span>
            Added on{" "}
            {dayjs(selectedItem.created_at).format("MMMM D, YYYY • h:mm A")}
          </span>
        </div>

        <Divider className="my-3" />

        {/* Price */}
        <div className="rounded-lg bg-gray-50 dark:bg-[#020617] p-4">
          <p className="text-xs text-gray-500 mb-1">Price</p>
          <p className="text-2xl font-semibold text-[#fa8c16]">
            ₱{selectedItem.price}
          </p>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-gray-50 dark:bg-[#020617] p-4">
          <p className="text-xs text-gray-500 mb-1">Description</p>
          <p className="leading-relaxed">
            {selectedItem.description || "No description provided."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button type="primary" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewDetailsModal;
