import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, message, Modal } from "antd";
import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import {
  saveadminInfo,
  saveClientInfo,
  saveworkerInfo,
} from "../zustand/store/store.provider";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { T_LoginPayload, T_LoginResponse } from "../types";

const LoginCard = () => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false); // New state for terms modal
  const [isChecked, setIsChecked] = useState(false); // Track checkbox state
  const [isForgotPasswordVisible, setIsForgotPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const onFinish = async (values: T_LoginPayload) => {
    // Check if the checkbox is checked
    if (!isChecked) {
      message.error(
        "You must agree to the Terms of Service and Privacy Policy to proceed.",
      );
      return; // Prevent form submission
    }
    try {
      const response = await axios.post<T_LoginResponse>(
        `${apiUrl}/login`,
        values,
      );

      if (response.data.success) {
        const { user, token } = response.data;

        if (
          !user ||
          !user.fname ||
          !user.lname || // Check for last name
          !user.email ||
          !user.role ||
          !user.user_id ||
          !user.pnum || // Ensure pnum is not null or empty
          user.pnum.trim() === "" || // Additional check to make sure pnum is not empty
          user.lname.trim() === "" // Additional check to make sure lname is not empty
        ) {
          console.error("Missing user data in response:", response.data);
          alert("Login failed: Missing user data.");
          return;
        }

        // ✅ Log user data to console
        console.log("Logged in user:", user);
        console.log("Phone number:", user.pnum); // Log the phone number separately
        console.log("Full name:", user.fname, user.lname); // Log full name

        if (user.role === "admin") {
          saveadminInfo(user);
        } else if (user.role === "client") {
          saveClientInfo(user);
        } else if (user.role === "worker") {
          saveworkerInfo(user);
        }

        // ✅ Store authentication status, JWT, and user details
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userRole", user.role);
        sessionStorage.setItem("fname", user.fname);
        sessionStorage.setItem("email", user.email);
        sessionStorage.setItem("phone", user.pnum);
        sessionStorage.setItem("lname", user.lname);
        sessionStorage.setItem("user_id", user.user_id.toString()); // ✅ Save user_id as string

        // ✅ Redirect based on role
        if (user.role === "admin") {
          navigate("/Admin/Dashboard");
        } else if (user.role === "worker") {
          navigate("/Worker/Dashboard");
        } else if (user.role === "client") {
          navigate("/");
        } else {
          alert("Unknown role: " + user.role);
        }
      } else {
        alert(response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Check API response.");
    }
  };
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#F8F5F2] px-6 sm:px-10">
      <div className="w-full max-w-md  p-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-[#1F262A] text-center">
            Get Started Now
          </h2>

          <p className="text-gray-500 mt-2 text-center">
            Please login to continue
          </p>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          {/* EMAIL */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              {
                validator: async (_, value) => {
                  if (value) {
                    try {
                      const response = await axios.post(
                        `${apiUrl}/check-email-status`,
                        { email: value },
                      );

                      if (response.data.status !== "active") {
                        return Promise.reject(
                          new Error(
                            "Please verify your email account in your inbox.",
                          ),
                        );
                      }
                    } catch (error) {
                      if (
                        axios.isAxiosError(error) &&
                        error.response?.status === 404
                      ) {
                        return Promise.reject(new Error("Email not found."));
                      }

                      return Promise.reject(
                        new Error("Error verifying email."),
                      );
                    }
                  }
                },
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Enter your email"
              prefix={<Mail size={18} />}
              className="h-12 rounded-xl"
              autoComplete="username"
            />
          </Form.Item>

          {/* PASSWORD */}
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Please enter your password",
              },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Enter your password"
              prefix={<Lock size={18} />}
              className="h-12 rounded-xl"
              autoComplete="current-password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          {/* CHECKBOX + FORGOT */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <Checkbox onChange={(e) => setIsChecked(e.target.checked)}>
              <span className="text-sm text-gray-600">
                Agree to{" "}
                <span
                  onClick={() => setIsTermsModalOpen(true)}
                  className="text-blue-500 cursor-pointer font-medium"
                >
                  Terms
                </span>
              </span>
            </Checkbox>

            <button
              type="button"
              onClick={() => setIsForgotPasswordVisible(true)}
              className="text-sm text-[#1F262A] hover:underline whitespace-nowrap"
            >
              Forgot Password?
            </button>
          </div>

          <Form.Item>
            <Button
              type="primary"
              block
              size="large"
              className="text-xl h-12 rounded-lg shadow-md"
              htmlType="submit"
              disabled={!isChecked}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Don’t have an account yet?{" "}
            <Link to="/Register" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-gray-400">
          © 2025 Active, All Rights Reserved
        </p>
      </div>

      <ForgotPasswordModal
        visible={isForgotPasswordVisible}
        onClose={() => setIsForgotPasswordVisible(false)}
      />

      <Modal
        open={isTermsModalOpen}
        onCancel={() => setIsTermsModalOpen(false)}
        footer={null}
        title="Terms of Service"
      >
        <div className="p-4">
          <h2 className="font-bold text-xl">Terms of Service</h2>
        </div>
      </Modal>
    </div>
  );
};

export default LoginCard;
