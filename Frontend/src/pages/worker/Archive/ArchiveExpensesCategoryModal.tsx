import { UploadOutlined } from "@ant-design/icons";
import { Button, Modal, Table, Tooltip, Tag } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";

interface UsedSupplyCategoryItem {
  category: string;
  created_at: string;
  status: string;
  expenses_category_id: number;
}

interface UsedCategoriesModalProps {
  isArchivedModalVisible: boolean; // rename back
  onClose: () => void;
  onRestore?: () => void; // <-- optional callback
}

const ArchiveExpensesCategoryModal = ({
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
          `${apiUrl}/get_archive_expenses_categories`,
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

  const handleRestore = async (expenses_category_id: number) => {
    Modal.confirm({
      title: "Are you sure you want to restore this category?",
      content: "This will restore the category back to active status.",
      okText: "Yes, Restore",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.post(
            `${apiUrl}/restore_category_expenses/${expenses_category_id}`
          );

          setUsedCategories((prev) =>
            prev.filter(
              (item) => item.expenses_category_id !== expenses_category_id
            )
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
      dataIndex: "expenses_category_id",
      key: "expenses_category_id",
    },
    {
      title: "Category Name",
      dataIndex: "category",
      key: "category",
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
            onClick={() => handleRestore(record.expenses_category_id)}
          >
            Restore
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      title="Archived Expense Categories"
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
          rowKey="expenses_category_id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: true }}
        />
      )}
    </Modal>
  );
};

export default ArchiveExpensesCategoryModal;
