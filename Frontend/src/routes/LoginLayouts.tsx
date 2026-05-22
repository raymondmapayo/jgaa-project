import LoginUi from "./LoginUi";
import LoginCard from "./LoginCard";

const LoginLayouts = () => {
  return (
    <div className="min-h-screen w-full flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-[100%] bg-[#1F262A] rounded-r-3xl overflow-hidden">
        <LoginUi />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <LoginCard />
      </div>
    </div>
  );
};

export default LoginLayouts;
