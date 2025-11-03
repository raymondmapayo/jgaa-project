import { Modal, Tabs } from "antd";
import EditValidationModal from "./EditValidationModal";
import ValidationModal from "./ValidationModal";

interface ValidationEditTabsModalProps {
  isVisible: boolean;
  onClose: () => void;
  order: any;
  transaction: any;
  onUpdateOrder?: (updatedOrder: any) => void;
}

const { TabPane } = Tabs;

const ValidationEditTabsModal: React.FC<ValidationEditTabsModalProps> = ({
  isVisible,
  onClose,
  order,

  onUpdateOrder,
}) => {
  return (
    <Modal
      title={`ORDER ID-${order?.order_id || ""}`}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={690} // ✅ smaller width for box look
      style={{
        maxHeight: "600px", // ✅ limit height to create box shape
        overflowY: "auto", // ✅ scroll if content exceeds height
        borderRadius: 12, // ✅ smooth rounded box corners
      }}
      bodyStyle={{
        padding: "16px", // ✅ balanced inner spacing
      }}
      centered // ✅ center modal on screen
    >
      <Tabs defaultActiveKey="1" centered>
        <TabPane tab="Validate" key="1">
          {/* ✅ FIX: pass order instead of transaction */}
          <ValidationModal order={order} />
        </TabPane>
        <TabPane tab="Edit" key="2">
          <EditValidationModal order={order} onUpdateOrder={onUpdateOrder} />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ValidationEditTabsModal;
