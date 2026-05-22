import { Check } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen w-full flex">
      {/* LEFT SIDE */}
      <div className="w-full lg:w-full bg-[#1F262A] relative flex items-start justify-start p-10 pl-48 rounded-r-3xl overflow-hidden">
        {/* CONTENT */}
        <div className="max-w-md text-white z-10">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight whitespace-nowrap  ml-20">
            JGAA Thai Restaurant
          </h1>
          <p className="mt-5 ml-6 text-gray-300 text-base leading-relaxed">
            <span className="whitespace-nowrap">
              Enter your credentials to access your account and manage JGAA Thai
              Restaurant efficiently.
            </span>
          </p>
          {/* DEVICE MOCKUP */}
          <div className="mt-20 relative flex justify-start items-end -translate-x-40">
            {/* LAPTOP (MAIN) */}
            <img
              src="lap.png"
              alt="laptop"
              className="w-[950px] lg:w-[950px] object-contain rounded-3xl shadow-2xl"
            />

            {/* IPHONE (BOTTOM RIGHT / SLIGHTLY DOWN) */}
            <img
              src="p.png"
              alt="iphone"
              className="w-[100px] object-contain absolute bottom-[-20px] right-[-45px] rounded-3xl shadow-xl"
            />
          </div>
          {/* RIGHT SIDE CHECK LIST */}

          {/* RIGHT SIDE CHECK LIST (DETACHED FROM H1) */}
          <div className="absolute top-1/2 right-5 -translate-y-1/2 text-white max-w-md space-y-3">
            <div className="flex items-center gap-2">
              <Check className="text-green-400 w-5 h-5" />
              <span>Smart Reservation Management</span>
            </div>

            <div className="flex items-center gap-2">
              <Check className="text-green-400 w-5 h-5" />
              <span>Order Management</span>
            </div>

            <div className="flex items-center gap-2">
              <Check className="text-green-400 w-5 h-5" />
              <span>Menu & Inventory Control</span>
            </div>

            <p className="text-sm opacity-80 leading-relaxed">
              Manage reservations, handle customer orders, organize your menu,
              and improve restaurant efficiency with a simple and clean system
              designed for daily operations.
            </p>
          </div>

          {/* FEATURE CARDS */}
          <div className="mt-28 w-[950px] flex gap-6 -translate-x-40">
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-4 flex-1 hover:bg-white/10 transition-all duration-300">
              <h3 className="font-semibold text-lg">Reservation Management</h3>
              <p className="text-sm text-gray-300 mt-1">
                Handle customer bookings smoothly and avoid scheduling
                conflicts.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-4 flex-1 hover:bg-white/10 transition-all duration-300">
              <h3 className="font-semibold text-lg">Secure System</h3>
              <p className="text-sm text-gray-300 mt-1">
                Keep customer and restaurant data safe and protected at all
                times.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-4 flex-1 hover:bg-white/10 transition-all duration-300">
              <h3 className="font-semibold text-lg">Menu & Order Handling</h3>
              <p className="text-sm text-gray-300 mt-1">
                Easily manage menu items and process customer orders
                efficiently.
              </p>
            </div>
          </div>
        </div>

        {/* DECORATION */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute w-72 h-72 bg-white/5 rounded-full -top-16 -left-16" />
          <div className="absolute w-96 h-96 bg-white/5 rounded-full bottom-[-120px] right-[-120px]" />
        </div>
      </div>
    </div>
  );
};

export default Login;
