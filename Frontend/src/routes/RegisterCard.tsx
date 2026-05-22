import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, message } from "antd";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { T_RegisterPayload } from "../types";
import { Mail, Lock, User, MapPin } from "lucide-react";
const Register = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const onFinish = async (values: T_RegisterPayload) => {
    try {
      // Send registration details to the backend
      const response = await axios.post(`${apiUrl}/register`, values);

      if (response.data.success) {
        message.success("Registration successful");
        // Redirect to login after success message
        setTimeout(() => navigate("/success"), 2000);
      } else {
        message.error(response.data.message || "Registration failed");
        console.error("Backend error message:", response.data.message);
      }
    } catch (error) {
      message.error("Registration failed. Check API response.");
      console.error("API request error:", error);
    }
  };
  return (
    <>
      {/* RIGHT SIDE */}
      <div className="w-full h-full flex items-center justify-center bg-[#F8F5F2] px-6 sm:px-5">
        <div className="w-full max-w-6xl px-2 sm:px-4 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-center text-4xl font-bold text-[#1F262A]">
              Create Account
            </h2>

            <p className="text-gray-500 mt-2 text-center">
              Please fill all information below
            </p>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            {/* FIRST + LAST NAME */}
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fname"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your first name",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="First Name"
                    prefix={<User size={18} />}
                    className="h-12 rounded-xl"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="lname"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your last name",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Last Name"
                    prefix={<User size={18} />}
                    className="h-12 rounded-xl"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* PHONE + EMAIL */}
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="pnum"
                  rules={[
                    {
                      required: true,
                      message: "Please enter phone number",
                    },
                    {
                      pattern: /^9\d{9}$/,
                      message: "Enter valid number starting with 9",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    className="h-12 rounded-xl"
                    placeholder="9XXXXXXXXX"
                    maxLength={10}
                    prefix={
                      <div className="flex items-center gap-2">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/9/99/Flag_of_the_Philippines.svg"
                          className="w-5 h-5"
                        />
                        <span>+63</span>
                      </div>
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Please enter email",
                    },
                    {
                      type: "email",
                      message: "Invalid email",
                    },
                    {
                      async validator(_, value) {
                        if (!value) return Promise.resolve();

                        try {
                          const response = await axios.post(
                            `${apiUrl}/check-email`,
                            {
                              email: value,
                            },
                          );

                          if (!response.data.available) {
                            return Promise.reject("Email already used");
                          }

                          return Promise.resolve();
                        } catch {
                          return Promise.reject("Error checking email");
                        }
                      },
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Email"
                    prefix={<Mail size={18} />}
                    className="h-12 rounded-xl"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* PASSWORD + ADDRESS */}
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter password",
                    },
                  ]}
                >
                  <Input.Password
                    size="large"
                    placeholder="Password"
                    className="h-12 rounded-xl"
                    prefix={<Lock size={18} />}
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="address"
                  rules={[
                    {
                      required: true,
                      message: "Please enter address",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Address"
                    prefix={<MapPin size={18} />}
                    className="h-12 rounded-xl"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Button
              htmlType="submit"
              type="primary"
              block
              size="large"
              className="!h-12 !rounded-xl !bg-[#1F262A]"
            >
              Register
            </Button>
          </Form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          <p className="text-center mt-6 text-sm text-gray-400">
            © 2025 Active, All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
