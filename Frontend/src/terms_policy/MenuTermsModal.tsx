import React, { useEffect, useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

interface MenuTermsModalProps {
  open: boolean;
  onContinue: () => void;
  onClose: () => void;
}

const MenuTermsModal: React.FC<MenuTermsModalProps> = ({
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
      title="Before Adding a Menu"
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      width={480}
    >
      <div className="py-3">
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
          <ExclamationCircleOutlined className="mt-1 text-xl" />

          <div>
            <h3 className="mb-2 font-semibold">Important Reminder</h3>

            <p className="text-sm leading-6">
              After adding a menu, you must go to{" "}
              <strong>Ingredients Management</strong> and assign the necessary
              ingredients.
            </p>

            <p className="mt-2 text-sm leading-6">
              Menus without assigned ingredients will not be displayed on the
              client side.
            </p>
          </div>
        </div>

        <Checkbox
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        >
          <span className="text-sm">
            I understand and agree to assign ingredients to my menu after adding
            it.
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

export default MenuTermsModal;
