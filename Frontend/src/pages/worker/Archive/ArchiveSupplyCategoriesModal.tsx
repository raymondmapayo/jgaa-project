import { UploadOutlined } from "@ant-design/icons";
import { Button, Modal, Table, Tooltip, Tag } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";

interface UsedSupplyCategoryItem {
  cat_supply_id: number;
  supply_cat_name: string;
  created_at: string;
  created_by: string;
  status: string;
}

interface UsedCategoriesModalProps {
  isArchivedModalVisible: boolean; // rename back
  onClose: () => void;
  onRestore?: () => void; // <-- optional callback
}

const UsedSupplyCategoriesModal = ({
  isArchivedModalVisible,
  onClose,
  onRestore, // <-- add this prop
}: UsedCategoriesModalProps) => {
  const [usedCategories, setUsedCategories] = useState<
    UsedSupplyCategoryItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let isMounted = true;

    const fetchUsedCategories = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/get_archive_supply_categories`,
          {
            headers: { "Cache-Control": "no-cache" },
          }
        );
        if (isMounted) {
          setUsedCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching used categories:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUsedCategories();
    const interval = setInterval(fetchUsedCategories, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl]);

  const handleRestore = async (cat_supply_id: number) => {
    Modal.confirm({
      title: "Are you sure you want to restore this category?",
      content: "This will restore the category back to active status.",
      okText: "Yes, Restore",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.post(
            `${apiUrl}/restore_category_supply/${cat_supply_id}`
          );

          setUsedCategories((prev) =>
            prev.filter((item) => item.cat_supply_id !== cat_supply_id)
          );

          // ✅ Notify parent to refresh main table
          if (onRestore) onRestore();
        } catch (error) {
          console.error("Error restoring category:", error);
        }
      },
    });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "cat_supply_id",
      key: "cat_supply_id",
    },
    {
      title: "Category Name",
      dataIndex: "supply_cat_name",
      key: "supply_cat_name",
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "deleted" ? "red" : "green"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: UsedSupplyCategoryItem) => (
        <Tooltip title="Restore Category">
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => handleRestore(record.cat_supply_id)}
          >
            Restore
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      title="Used Supply Categories"
      visible={isArchivedModalVisible}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{ maxWidth: "1000px" }}
    >
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table
          dataSource={usedCategories}
          columns={columns}
          rowKey="cat_supply_id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: true }}
        />
      )}
    </Modal>
  );
};

export default UsedSupplyCategoriesModal;
