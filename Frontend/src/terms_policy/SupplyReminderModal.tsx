import React, { useEffect, useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

interface SupplyReminderModalProps {
  open: boolean;
  onContinue: () => void;
  onClose: () => void;
}

const SupplyReminderModal: React.FC<SupplyReminderModalProps> = ({
  open,
  onContinue,
  onClose,
}) => {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (open) {
      setAccepted(false);
    }
  }, [open]);

  const handleCancel = () => {
    setAccepted(false);
    onClose();
  };

  const handleContinue = () => {
    if (!accepted) return;
    onContinue();
  };

  return (
    <Modal
      title="Before Adding Ingredients"
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      width={480}
      closable
    >
      <div className="py-3">
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
          <ExclamationCircleOutlined className="mt-1 text-xl" />

          <div>
            <h3 className="mb-2 font-semibold">Important Reminder</h3>

            <p className="text-sm leading-6">
              No ingredients are available in the Ingredient Name dropdown.
              Please go to <strong>Inventory &amp; Supplies</strong> and click{" "}
              <Link
                to="/Worker/Manage/Supply"
                onClick={() => {
                  setAccepted(false);
                  onClose();
                }}
                className="font-semibold text-blue-600 underline hover:text-blue-800"
              >
                Supply
              </Link>{" "}
              to add your supplies first.
            </p>

            <p className="mt-2 text-sm leading-6">
              After adding your supplies, return to Ingredients Management and
              select the ingredient you need.
            </p>
          </div>
        </div>

        <Checkbox
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        >
          <span className="text-sm">
            I understand that I need to add supplies in Inventory &amp; Supplies
            before adding ingredients.
          </span>
        </Checkbox>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={handleCancel}>Cancel</Button>

          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={!accepted}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SupplyReminderModal;
