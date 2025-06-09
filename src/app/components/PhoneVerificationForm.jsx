"use client";
import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export const OtpSender = ({ phoneNumber, setPhoneNumber, onOtpSent }) => {
  const handleSendOtp = async () => {
    try {
      const response = await axios.post("/api/send-otp", { phoneNumber });
      window.alert(`Your OTP is ${response.data.otp}`);
      console.log("Generated OTP is ",response.data.otp)
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

export const OtpVerifier = ({ phoneNumber, onVerified }) => {
  const [otp, setOtp] = useState("");

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

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-2"
      />
      <button
        onClick={handleVerifyOtp}
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Verify OTP
      </button>
    </div>
  );
};


