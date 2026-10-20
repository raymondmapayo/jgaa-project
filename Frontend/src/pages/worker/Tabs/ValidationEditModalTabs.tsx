import { Modal, Tabs } from "antd";
import EditValidationModal from "../../WorkerModals/EditValidationModal";
import ValidationModal from "../../WorkerModals/ValidationModal";

interface ValidationEditTabsModalProps {
  isVisible: boolean;
  onClose: () => void;
  order: any;
  transaction: any;
  onUpdateOrder?: (updatedOrder: any) => void;
  onSuccess?: () => void;
}

const { TabPane } = Tabs;

const ValidationEditTabsModal: React.FC<ValidationEditTabsModalProps> = ({
  isVisible,
  onClose,
  order,
  onUpdateOrder,
  onSuccess,
}) => {
  return (
    <Modal
      title={`ORDER ID-${order?.order_id || ""}`}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={690}
      style={{
        maxHeight: "600px",
        overflowY: "auto",
        borderRadius: 12,
      }}
      bodyStyle={{
        padding: "16px",
      }}
      centered
    >
      <Tabs defaultActiveKey="1" centered>
        <TabPane tab="Validate" key="1">
          <ValidationModal order={order} />
        </TabPane>

        <TabPane tab="Edit" key="2">
          <EditValidationModal
            order={order}
            onUpdateOrder={onUpdateOrder}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ValidationEditTabsModal;
