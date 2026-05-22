import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { showCards } from "../../utils/showCards";
import { Card, Typography, Grid } from "antd";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ShowCard = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const truncateWords = (text: string, wordLimit: number) => {
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + ".....";
  };

  return (
    <Card
      bordered={false}
      style={{
        width: "100%",
        height: isMobile ? 260 : "100%",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        background: "#111",
      }}
      styles={{
        body: {
          padding: 0,
          height: "100%",
        },
      }}
    >
      {/* 🔥 CONTROLS OVERLAY */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? 6 : 10,
          left: isMobile ? 6 : 10,
          right: isMobile ? 6 : 10,
          zIndex: 99,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {/* pagination */}
        <div
          className="custom-pagination"
          style={{
            display: "flex",
            gap: 6,
            pointerEvents: "auto",
            transform: isMobile ? "scale(0.85)" : "scale(1)",
          }}
        />

        {/* arrows */}
        <div
          style={{
            display: "flex",
            gap: isMobile ? 6 : 10,
            pointerEvents: "auto",
          }}
        >
          <div className="custom-prev" style={navBtnStyle(isMobile)}>
            <FaChevronLeft color="#111" />
          </div>

          <div className="custom-next" style={navBtnStyle(isMobile)}>
            <FaChevronRight color="#111" />
          </div>
        </div>
      </div>

      {/* SWIPER */}
      <Swiper
        modules={[Pagination, Autoplay, Navigation]}
        slidesPerView={1}
        loop={true} // ✅ this is enough
        pagination={{
          clickable: true,
          el: ".custom-pagination",
        }}
        navigation={{
          prevEl: ".custom-prev",
          nextEl: ".custom-next",
        }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        style={{ height: "100%" }}
      >
        {showCards.map((item) => (
          <SwiperSlide key={item.id}>
            <Card
              bordered={false}
              style={{
                height: "100%",
                borderRadius: 16,
                overflow: "hidden",
                position: "relative",
                color: "#fafafa",
                background: "#000",
              }}
            >
              {/* IMAGE */}
              <img
                src={item.image}
                alt={item.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.6)",
                }}
              />

              {/* GRADIENT */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "70%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                }}
              />

              {/* CONTENT */}
              <div
                style={{
                  position: "absolute",
                  bottom: isMobile ? 12 : 18, // 🔥 moved UP
                  left: 0,
                  width: "100%",
                  zIndex: 2,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                }}
              >
                <Title
                  level={isMobile ? 5 : 4}
                  style={{
                    margin: 0,
                    color: "#90ee90",
                    fontWeight: 700,
                  }}
                >
                  {truncateWords(item.title, isMobile ? 6 : 8)}
                </Title>

                <Text
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    opacity: 0.85,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 8,
                  }}
                >
                  {truncateWords(item.description, isMobile ? 10 : 15)}
                </Text>
              </div>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </Card>
  );
};

/* ONLY responsive tweak here */
const navBtnStyle = (isMobile: boolean): React.CSSProperties => ({
  width: isMobile ? 28 : 32,
  height: isMobile ? 28 : 32,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
});

export default ShowCard;
