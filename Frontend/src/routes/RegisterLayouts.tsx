import LoginUi from "./LoginUi";
import RegisterCard from "./RegisterCard";

const RegisterLayouts = () => {
  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-[100%] bg-[#1F262A]">
        <LoginUi />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <RegisterCard />
      </div>
    </div>
  );
};

export default RegisterLayouts;
