import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { T_RegisterPayload } from "../types";

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
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Side: Branding/Image */}
      <div className="hidden md:flex w-full md:w-1/2 bg-[#fff7ec] text-black flex-col justify-center items-center p-12 rounded-r-3xl shadow-lg">
        <h2 className="text-5xl font-extrabold text-center leading-snug drop-shadow-lg">
          JGAA Thai Restaurant
        </h2>
        <p className="mt-4 text-xl text-center opacity-90 max-w-lg tracking-wide leading-relaxed">
          Enter your credentials to access your account and manage JGAA Thai
          Restaurant efficiently.
        </p>

        {/* Monitor with Stand */}
        <div className="mt-8 flex flex-col items-center">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-4 w-[28rem] h-64 relative border-4 border-gray-800">
            <div className="w-full h-full bg-black rounded-md overflow-hidden flex justify-center items-center">
              <img
                src="/LoginLogo.png"
                alt="Restaurant Dashboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="w-40 h-3 bg-gray-700 rounded-lg mt-2"></div>
          <div className="w-64 h-1 bg-gray-600 rounded-lg mt-1"></div>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex w-full md:w-1/2 justify-center items-center bg-white md:bg-transparent">
        <div className="w-full sm:w-[95%] md:w-[80%] bg-white p-6 sm:p-8 md:p-10 rounded-none md:rounded-2xl shadow-none md:shadow-xl">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-800">
            Create an Account
          </h1>

          <Form layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="First Name"
                  name="fname"
                  rules={[
                    { required: true, message: "Please enter your first name" },
                  ]}
                >
                  <Input placeholder="Enter First Name" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Last Name"
                  name="lname"
                  rules={[
                    { required: true, message: "Please enter your last name" },
                  ]}
                >
                  <Input placeholder="Enter Last Name" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Phone Number"
                  name="pnum"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your phone number",
                    },
                    {
                      pattern: /^9\d{9}$/,
                      message:
                        "Please enter a valid 10-digit phone number starting with 9",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="9XX-XXX-XXXX"
                    maxLength={10}
                    prefix={
                      <div className="flex items-center">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/9/99/Flag_of_the_Philippines.svg"
                          alt="Philippine Flag"
                          className="w-5 h-5 mr-2 rounded-sm"
                        />
                        <span className="text-gray-700 font-medium">+63</span>
                      </div>
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email" },
                    {
                      async validator(_, value) {
                        if (!value) return Promise.resolve();

                        try {
                          const response = await axios.post(
                            `${apiUrl}/check-email`,
                            {
                              email: value,
                            }
                          );
                          if (!response.data.available) {
                            return Promise.reject(
                              "This email is already in use."
                            );
                          }
                          return Promise.resolve();
                        } catch {
                          return Promise.reject("Error checking email.");
                        }
                      },
                    },
                  ]}
                >
                  <Input placeholder="Enter Email" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Please enter your password" },
                  ]}
                >
                  <Input.Password
                    placeholder="Enter Password"
                    size="large"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[
                    { required: true, message: "Please enter your address" },
                  ]}
                >
                  <Input placeholder="Enter Address" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" block size="large" htmlType="submit">
                Register
              </Button>
            </Form.Item>
          </Form>

          <div className="flex justify-center mt-4">
            <p className="text-base sm:text-lg">
              Already have an account?{" "}
              <a href="/Login" className="text-blue-500 hover:underline">
                Sign in
              </a>
            </p>
          </div>

          <p className="text-center mt-6 text-sm sm:text-lg text-gray-500">
            © 2025 Active, All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
