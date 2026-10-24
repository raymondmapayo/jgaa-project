import axios from "axios";
import { useEffect, useState } from "react";
import { FaQuoteRight } from "react-icons/fa";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

interface Testimonial {
  text: string;
  name: string;
  profile_pic?: string;
}

const TestimonialSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true);

        const response = await axios.get(`${apiUrl}/Testimonial`);

        const formattedTestimonials: Testimonial[] = response.data.map(
          (testimonial: any) => ({
            text: testimonial.testimonial_text,
            name: `${testimonial.fname} ${testimonial.lname}`,
            profile_pic: testimonial.profile_pic,
          }),
        );

        setTestimonials(formattedTestimonials);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, [apiUrl]);

  return (
    <section className="w-full my-12 py-12 bg-gray-100">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h4 className="font-core text-yellow-500 text-xl font-medium uppercase">
            Our Testimonial
          </h4>

          <h1 className="font-core text-gray-800 text-3xl md:text-4xl font-bold">
            What Our Customers Say
          </h1>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No testimonials available.
          </p>
        ) : (
          /* Swiper Section */
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{ delay: 3000 }}
            pagination={{ clickable: true }}
            navigation
            breakpoints={{
              640: {
                slidesPerView: 1,
              },
              1024: {
                slidesPerView: 2,
              },
            }}
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <div className="bg-white rounded-lg shadow-lg p-6 relative mx-2">
                  {/* Quote Icon */}
                  <FaQuoteRight className="text-gray-400 text-3xl absolute bottom-4 right-4" />

                  {/* Testimonial Text */}
                  <p className="text-gray-600 italic mb-6">
                    "{testimonial.text}"
                  </p>

                  {/* Client Details */}
                  <div className="flex items-center">
                    <img
                      src={
                        testimonial.profile_pic
                          ? testimonial.profile_pic.startsWith("http")
                            ? testimonial.profile_pic
                            : `${apiUrl}/uploads/images/${testimonial.profile_pic}`
                          : "/avatar.jpg"
                      }
                      alt={testimonial.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-500 object-cover"
                    />

                    {/* Client Info */}
                    <div className="ml-4">
                      <h4 className="text-gray-800 font-bold text-lg">
                        {testimonial.name}
                      </h4>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
};

export default TestimonialSection;
