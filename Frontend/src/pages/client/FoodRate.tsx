import { Button, Modal, Rate, Input } from "antd";
import { useState, useEffect } from "react";

// Define the types for the product data
interface Product {
  menu_img: string;
  item_name: string;
}

interface FoodRateProps {
  visible: boolean;
  selectedProduct: Product | null;
  ratingValue: number;
  onRateChange: (value: number) => void;
  onCancel: () => void;
  onSubmit: (comment: string) => void; // Pass comment on submit
  rated: boolean; // New prop to check if the product is already rated
}

const apiUrl = import.meta.env.VITE_API_URL;

const FoodRate: React.FC<FoodRateProps> = ({
  visible,
  selectedProduct,
  ratingValue,
  onRateChange,
  onCancel,
  onSubmit,
  rated,
}) => {
  const [comment, setComment] = useState<string>("");

  // Clear comment when modal closes
  useEffect(() => {
    if (!visible) setComment("");
  }, [visible]);

  return (
    <Modal
      title="Rate this Product:"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel} className="text-gray-500">
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => onSubmit(comment)}
          className="bg-green-500 text-white"
          disabled={rated} // Disable the button if the product is already rated
        >
          Submit
        </Button>,
      ]}
    >
      {selectedProduct && (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            {/* Left Section: Image */}
            <div className="flex-shrink-0">
              <img
                src={
                  selectedProduct.menu_img
                    ? selectedProduct.menu_img.startsWith("http")
                      ? selectedProduct.menu_img
                      : `${apiUrl}/uploads/images/${selectedProduct.menu_img}`
                    : "https://via.placeholder.com/80?text=No+Image"
                }
                alt={selectedProduct.item_name}
                className="w-20 h-20 rounded-full shadow-md"
              />
            </div>

            {/* Right Section: Product Title and Rating */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedProduct.item_name}
              </h3>

              {rated ? (
                <p className="text-gray-700">
                  You have already rated this product!
                </p>
              ) : (
                <>
                  <Rate
                    value={ratingValue}
                    onChange={onRateChange}
                    className="mb-2"
                  />
                  <p className="text-gray-700 mb-2">
                    Rating: {ratingValue} stars
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Comments Textbox */}
          {!rated && (
            <div className="flex flex-col">
              <label className="text-gray-700 mb-1 font-medium">
                Add a comment (optional):
              </label>
              <Input.TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Write your comment here..."
                className="resize-none"
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default FoodRate;
