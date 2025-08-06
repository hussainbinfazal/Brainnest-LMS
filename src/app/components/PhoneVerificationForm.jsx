"use client";
import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export const OtpSender = ({ phoneNumber, setPhoneNumber, onOtpSent }) => {
  const handleSendOtp = async () => {
    try {
      const response = await axios.post("/api/send-otp", { phoneNumber });
      // Show OTP in development mode
      if(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV){
        toast.success(`Development Mode - Your OTP is: ${response.data.otp || 'Check console'}`);
        console.log("Generated OTP is:", response.data.otp);
      }
      toast.success(response.data.message || "OTP sent successfully");
      onOtpSent(); // Notify parent
      return response
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send OTP");
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleSendOtp}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Send OTP
      </button>
    </div>
  );
};

;

// Email OTP Components
export const EmailOtpSender = ({ email, onOtpSent }) => {
  const handleSendOtp = async () => {
    try {
      const response = await axios.post("/api/send-email-otp", { email });
      // Show OTP in development mode
      if(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV){
        toast.success(`Development Mode - Your Email OTP is: ${response.data.otp || 'Check console'}`);
        console.log("Generated Email OTP is:", response.data.otp);
      }
      toast.success(response.data.message || "Email OTP sent successfully");
      onOtpSent(); // Notify parent
      return response
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send email OTP");
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleSendOtp}
        className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
      >
        Send Email OTP
      </button>
    </div>
  );
};

export const EmailOtpVerifier = ({ email, onVerified, onChangeEmail }) => {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(50);
  const [resendCount, setResendCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const maxResendAttempts = 5;

  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    try {
      const response = await axios.post("/api/verify-email-otp", { email, otp });
      toast.success(response.data.message || "Email OTP verified");
      onVerified(); // Notify parent
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Email OTP verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount >= maxResendAttempts) {
      toast.error(`Maximum ${maxResendAttempts} resend attempts reached`);
      return;
    }

    try {
      const response = await axios.post("/api/send-email-otp", { email });
      
      // Show OTP in development mode
      if(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV){
        toast.success(`Development Mode - Your Email OTP is: ${response.data.otp || 'Check console'}`);
        console.log("Resent Email OTP is:", response.data.otp);
      }
      
      toast.success("Email OTP resent successfully");
      setCountdown(50);
      setResendCount(resendCount + 1);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to resend email OTP");
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">OTP sent to: {email}</span>
        <button
          onClick={onChangeEmail}
          className="text-purple-500 text-sm hover:underline"
        >
          Change Email
        </button>
      </div>
      
      <input
        type="text"
        placeholder="Enter Email OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-2"
      />
      <button
        onClick={handleVerifyOtp}
        disabled={isVerifying}
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isVerifying ? "Verifying..." : "Verify Email OTP"}
      </button>
      
      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span>Resend attempts: {resendCount}/{maxResendAttempts}</span>
        {countdown > 0 && <span>Resend in {countdown}s</span>}
      </div>
      
      <button
        onClick={handleResendOtp}
        disabled={countdown > 0 || resendCount >= maxResendAttempts}
        className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {countdown > 0 ? `Resend Email OTP (${countdown}s)` : 'Resend Email OTP'}
      </button>
    </div>
  );
};

export const OtpVerifier = ({ phoneNumber, onVerified, onChangeNumber }) => {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(50); // Start with 50 seconds after first OTP
  const [resendCount, setResendCount] = useState(0);
  const maxResendAttempts = 5;

  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post("/api/verify-otp", { phoneNumber, otp });
      toast.success(response.data.message || "OTP verified");
      onVerified(); // Notify parent
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "OTP verification failed");
    }
  };

  const handleResendOtp = async () => {
    if (resendCount >= maxResendAttempts) {
      toast.error(`Maximum ${maxResendAttempts} resend attempts reached`);
      return;
    }

    try {
      const response = await axios.post("/api/send-otp", { phoneNumber });
      
      // Show OTP in development mode
      if(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV){
        toast.success(`Development Mode - Your OTP is: ${response.data.otp || 'Check console'}`);
        console.log("Resent OTP is:", response.data.otp);
      }
      
      toast.success("OTP resent successfully");
      setCountdown(50); // 50 seconds countdown
      setResendCount(resendCount + 1);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">OTP sent to: {phoneNumber}</span>
        <button
          onClick={onChangeNumber}
          className="text-blue-500 text-sm hover:underline"
        >
          Change Number
        </button>
      </div>
      
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-2"
      />
      <button
        onClick={handleVerifyOtp}
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-2"
      >
        Verify OTP
      </button>
      
      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span>Resend attempts: {resendCount}/{maxResendAttempts}</span>
        {countdown > 0 && <span>Resend in {countdown}s</span>}
      </div>
      
      <button
        onClick={handleResendOtp}
        disabled={countdown > 0 || resendCount >= maxResendAttempts}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {countdown > 0 ? `Resend OTP (${countdown}s)` : 'Resend OTP'}
      </button>
    </div>
  );
};


