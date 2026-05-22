import { Menu, Modal, notification, Tabs } from "antd";
import Dropdown from "antd/es/dropdown/dropdown";
import TabPane from "antd/es/tabs/TabPane";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  FaBars,
  FaSearch,
  FaShoppingBag,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import useStore from "../../zustand/store/store";
import { logoutClient, selector } from "../../zustand/store/store.provider";
import AccountSetting from "./AccountSetting";
import ActivityLog from "./ActivityLog";
import BillingDetails from "./BillingDetails"; // Adjust path if needed
import ClientNotification from "./ClientNotification";
import CommentUs from "./CommentUs";
import UserDrawer from "../../Drawer/UserDrawer";
export const ClientHeader = () => {
  const client = useStore(selector("client"));
  const [isAccountSettingVisible, setIsAccountSettingVisible] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [isCommentUsVisible, setIsCommentUsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const userName = sessionStorage.getItem("fname");
  const userEmail = sessionStorage.getItem("email");
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  // Get the user profile picture from the backend
  useEffect(() => {
    const fetchProfilePic = async () => {
      try {
        const user_id = sessionStorage.getItem("user_id");
        if (user_id) {
          const response = await axios.get(`${apiUrl}/get_user/${user_id}`);
          setProfilePic(response.data.profile_pic); // Set profile picture URL
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePic();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutClient();
      // ✅ go to HOME page
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };
  const navigate = useNavigate();

  const isAuthenticated = client.isAuthenticated;

  const cartItemCount = Array.isArray(client?.cart)
    ? client.cart.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      )
    : 0; // Ensure client.cart is an array before calling reduce
  // Dropdown Menu for Products
  const productsMenu = (
    <Menu style={{ width: "200px" }}>
      <Menu.Item
        style={{ fontSize: "18px" }}
        onClick={() => setIsMenuOpen(false)}
      >
        <Link to="/Menus"> Menu</Link>
      </Menu.Item>
      <Menu.Item
        style={{ fontSize: "18px" }}
        onClick={() => setIsMenuOpen(false)}
      >
        <Link to="/Bestseller"> Bestseller</Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <header className="z-50 fixed top-0 w-full bg-white shadow-md">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-2 sm:py-3 md:py-4">
        {/* Left: Logo + Title */}
        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6">
          <img
            src="/logo.jpg"
            alt="JGAA Thai Restaurant Logo"
            className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 rounded-full"
          />
          <h1 className="font-core text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-orange-600 whitespace-nowrap">
            JGAA THAI RESTAURANT
          </h1>
        </div>

        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-600 hover:text-gray-800"
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Navigation Links & Icons (Desktop) */}
        <div className="hidden md:flex items-center ml-12 gap-8 xl:gap-14">
          {/* Navigation Links */}
          <nav className="flex font-core items-center space-x-6 text-gray-600 text-sm sm:text-base md:text-lg">
            <Link to="/" className="hover:text-orange-600 transition-colors">
              Home
            </Link>

            <Dropdown overlay={productsMenu} trigger={["hover"]}>
              <Link
                to="/shop"
                onClick={(e) => e.preventDefault()}
                className="hover:text-orange-600 transition-colors"
              >
                Buy now
              </Link>
            </Dropdown>

            <Link
              to="/Reservation"
              className="hover:text-orange-600 transition-colors"
            >
              Reservation
            </Link>
            <Link
              to="/Contact-Us"
              className="hover:text-orange-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Icons (Search, Cart, User) */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button className="text-yellow-500 hover:text-yellow-600 transform hover:scale-110 transition">
              <FaSearch size={24} />
            </button>
            {isAuthenticated ? (
              <div className="flex gap-4 sm:gap-6">
                <ClientNotification />
                {/* 🛒 Cart */}
                <button
                  onClick={() => {
                    const isAuthenticated =
                      sessionStorage.getItem("isAuthenticated") === "true";

                    if (!isAuthenticated) {
                      notification.info({
                        message: "Authentication Required",
                        description: "Please login first to view your cart.",
                        placement: "topRight",
                        duration: 2,
                      });
                      return; // 🔹 stop here if not authenticated
                    }

                    navigate("/My-Cart"); // ✅ only go to cart if authenticated
                  }}
                  className="relative text-blue-500 hover:text-blue-600 transform hover:scale-110 transition"
                >
                  <FaShoppingBag size={28} />
                  {cartItemCount > 0 && (
                    <span
                      className="
                     absolute 
                     -top-1 -right-2
                     text-[11px] sm:text-sm 
                     text-white bg-red-500 
                     rounded-full 
                     w-5 h-5 sm:w-5 sm:h-5 
                     flex items-center justify-center
                   "
                    >
                      {cartItemCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsUserDrawerOpen(true)}
                  className="text-orange-500 hover:text-orange-600 transform hover:scale-110 transition"
                >
                  <FaUser size={24} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="font-core text-gray-500 hover:text-gray-600 transform hover:scale-110 transition"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="lg:hidden flex flex-col bg-white shadow-md w-full fixed top-[64px] left-0 z-[9999]">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="px-6 py-3 hover:bg-gray-100 text-gray-700"
          >
            Home
          </Link>
          {/* 🔽 Mobile dropdown for Shop Now */}
          <Dropdown overlay={productsMenu} trigger={["click"]}>
            <button className="px-6 py-3 text-left hover:bg-gray-100 text-gray-700 w-full">
              Shop Now
            </button>
          </Dropdown>

          <Link
            to="/Reservation"
            onClick={() => setIsMenuOpen(false)}
            className="px-6 py-3 hover:bg-gray-100 text-gray-700"
          >
            Reservation
          </Link>
          <Link
            to="/Contact-Us"
            onClick={() => setIsMenuOpen(false)}
            className="px-6 py-3 hover:bg-gray-100 text-gray-700"
          >
            Contact
          </Link>
          {isAuthenticated ? (
            <>
              <ClientNotification asTextButton />

              <Link
                to="/My-Cart"
                onClick={() => setIsMenuOpen(false)}
                className="px-6 py-3 text-left hover:bg-gray-100 text-gray-700"
              >
                My Cart
              </Link>
              <button
                onClick={() => {
                  setIsUserDrawerOpen(true);
                  setIsMenuOpen(false);
                }}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 block w-full text-left"
              >
                Profile
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="font-core px-6 py-3 text-left hover:bg-gray-100 text-gray-700"
            >
              Login
            </button>
          )}
        </nav>
      )}

      {/* Modals */}
      <Modal
        open={isAccountSettingVisible}
        onCancel={() => setIsAccountSettingVisible(false)}
        footer={null}
        bodyStyle={{ padding: "20px" }}
        width={900}
      >
        <Tabs defaultActiveKey="account" centered>
          <TabPane tab="Account Settings" key="account">
            {/* ✅ Pass onClose to close the modal */}
            <AccountSetting onClose={() => setIsAccountSettingVisible(false)} />
          </TabPane>
          <TabPane tab="Billing Details" key="billing">
            <BillingDetails onClose={() => setIsAccountSettingVisible(false)} />
          </TabPane>
        </Tabs>
      </Modal>

      <Modal
        open={isLogVisible}
        onCancel={() => setIsLogVisible(false)}
        footer={null}
        bodyStyle={{ padding: "20px" }}
        width={800}
      >
        <ActivityLog />
      </Modal>
      <Modal
        open={isCommentUsVisible}
        onCancel={() => setIsCommentUsVisible(false)}
        footer={null}
        bodyStyle={{ padding: "20px" }}
        width={800}
      >
        <CommentUs />
      </Modal>
      <UserDrawer
        open={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        profilePic={profilePic}
        userName={userName}
        userEmail={userEmail}
        apiUrl={apiUrl}
        setIsAccountSettingVisible={setIsAccountSettingVisible}
        setIsLogVisible={setIsLogVisible}
        setIsCommentUsVisible={setIsCommentUsVisible}
        handleLogout={handleLogout}
      />
    </header>
  );
};

export default ClientHeader;
