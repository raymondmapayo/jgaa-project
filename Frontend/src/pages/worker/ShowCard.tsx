import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styled from "styled-components";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { showCards } from "../../utils/showCards";

// Pagination dots: small circles, the active one stretches into a pill
const Dots = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  .swiper-pagination-bullet {
    width: 8px;
    height: 8px;
    margin: 0 !important;
    border-radius: 9999px;
    background: #9ca3af;
    opacity: 1;
    transition:
      width 0.25s ease,
      background-color 0.25s ease;
  }

  .swiper-pagination-bullet-active {
    width: 22px;
    background: #2563eb;
  }
`;

const ShowCard = () => {
  return (
    <section className="relative h-[260px] w-full overflow-hidden rounded-3xl bg-gray-100 shadow-[0_10px_40px_-12px_rgba(30,64,175,0.25)] ring-1 ring-blue-100 md:h-full">
      {/* Controls */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
        <Dots className="custom-pagination pointer-events-auto rounded-full bg-white/90 px-3 py-2 shadow-md backdrop-blur" />

        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            className="custom-prev flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xs text-gray-800 shadow-md backdrop-blur"
          >
            <FaChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="custom-next flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xs text-gray-800 shadow-md backdrop-blur"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Slides */}
      <Swiper
        modules={[Pagination, Autoplay, Navigation]}
        slidesPerView={1}
        loop={true}
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
            <div className="relative h-full w-full">
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* Caption card */}
              <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur sm:inset-x-4 sm:bottom-4 sm:p-5">
                <span className="mb-2 block h-1 w-8 rounded-full bg-blue-600" />
                <h3 className="m-0 line-clamp-2 text-base font-extrabold leading-snug text-gray-900 sm:text-lg">
                  {item.title}
                </h3>
                <p className="m-0 mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600 sm:text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default ShowCard;
