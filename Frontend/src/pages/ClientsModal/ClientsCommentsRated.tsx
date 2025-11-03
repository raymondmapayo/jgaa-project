import React, { useEffect, useState } from "react";
import { Modal, Spin } from "antd";
import axios from "axios";
import { CustomRate } from "../../components/client/Rate";

const apiUrl = import.meta.env.VITE_API_URL;

interface ClientsCommentsRatedProps {
  visible: boolean;
  onCancel: () => void;
  menuName: string;
}

interface ReviewData {
  profile_pic: string;
  email: string;
  fname: string;
  lname: string;
  avg_rating: number;
  comments: string;
  created_at: string;
  total_avg_rating: number | string | null; // Backend may return string or null
  item_name: string;
}

const ClientsCommentsRated: React.FC<ClientsCommentsRatedProps> = ({
  visible,
  onCancel,
  menuName,
}) => {
  const [ratings, setRatings] = useState<ReviewData[]>([]);
  const [filteredRatings, setFilteredRatings] = useState<ReviewData[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && menuName) {
      setLoading(true);
      axios
        .get(`${apiUrl}/get_item_reviews/${encodeURIComponent(menuName)}`)
        .then((res) => {
          const data: ReviewData[] = res.data || [];
          setRatings(data);
          setFilteredRatings(data); // Initially show all reviews

          // Ensure total_avg_rating is always a number
          const avg =
            data.length > 0 ? Number(data[0].total_avg_rating) || 0 : 0;
          setAverageRating(avg);
        })
        .catch((err) => {
          console.error("Error fetching reviews:", err);
          setRatings([]);
          setFilteredRatings([]);
          setAverageRating(0);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, menuName]);

  // ⭐ Filter handler
  const handleFilter = (star: number | "all") => {
    if (star === "all") {
      setFilteredRatings(ratings);
    } else {
      const filtered = ratings.filter(
        (r) => Math.round(Number(r.avg_rating)) === star
      );
      setFilteredRatings(filtered);
    }
  };

  return (
    <Modal
      title={`Menu Ratings: ${menuName}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
      destroyOnClose
      className="rounded-lg"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* ⭐ Average Rating Section with Right-side Star Buttons */}
          <div className="flex mb-6 p-4 border-b-[2px] border-[#fff8e4] rounded-lg shadow-md bg-white justify-between">
            {/* Left: Average Rating */}
            <div className="flex flex-col justify-center">
              <p className="text-xl font-semibold mb-2">Average Rating</p>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-bold text-red-500">
                  {(averageRating || 0).toFixed(1)} / 5
                </p>
                <CustomRate value={averageRating || 0} />
              </div>
            </div>

            {/* Right: Filter Buttons */}
            <div className="flex flex-col gap-2 text-right">
              {/* Row 1 */}
              <div>
                <button
                  onClick={() => handleFilter("all")}
                  className="px-3 py-1 border rounded-full text-sm font-semibold hover:bg-orange-500 hover:text-white transition"
                >
                  All ({ratings.length})
                </button>
              </div>

              {/* Row 2 */}
              <div className="flex justify-end gap-2">
                {[5, 4, 3].map((star) => {
                  const count = ratings.filter(
                    (r) => Math.round(Number(r.avg_rating)) === star
                  ).length;
                  return (
                    <button
                      key={star}
                      onClick={() => handleFilter(star)}
                      className="px-3 py-1 border rounded-full text-sm font-semibold hover:bg-orange-500 hover:text-white transition"
                    >
                      {star} star ({count})
                    </button>
                  );
                })}
              </div>

              {/* Row 3 */}
              <div className="flex justify-end gap-2">
                {[2, 1].map((star) => {
                  const count = ratings.filter(
                    (r) => Math.round(Number(r.avg_rating)) === star
                  ).length;
                  return (
                    <button
                      key={star}
                      onClick={() => handleFilter(star)}
                      className="px-3 py-1 border rounded-full text-sm font-semibold hover:bg-orange-500 hover:text-white transition"
                    >
                      {star} star ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ⭐ Individual Reviews */}
          <div
            className="flex flex-col space-y-6 max-h-[400px] overflow-y-auto pr-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#fa8c16 #1f1f1f",
            }}
          >
            {filteredRatings.length === 0 ? (
              <p className="text-gray-400 text-center">No reviews yet.</p>
            ) : (
              filteredRatings.map((r, idx) => (
                <div key={idx} className="flex border-b pb-4 gap-3">
                  <img
                    src={
                      r.profile_pic
                        ? `http://localhost:8081/uploads/images/${r.profile_pic}`
                        : "avatar.jpg"
                    }
                    alt={r.fname + " " + r.lname}
                    className="w-12 h-12 rounded-full border-2 border-orange-500 shadow-md object-cover"
                  />
                  <div className="flex flex-col">
                    {/* Email */}
                    <span className="font-semibold text-gray-700 mb-2">
                      {r.fname} {r.lname}
                    </span>

                    {/* Rating Stars */}
                    <div className="mb-2">
                      <CustomRate value={Number(r.avg_rating) || 0} />
                    </div>

                    {/* Timestamp with Variation */}
                    <p className="text-sm text-gray-400 mb-2">
                      {new Date(r.created_at).toLocaleString()} | Variation:{" "}
                      {r.item_name}
                    </p>

                    {/* Comment */}
                    <p className="text-gray-700">{r.comments}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

export default ClientsCommentsRated;
