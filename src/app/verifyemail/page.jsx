"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store/useAuthStore";

const page = () => {
  const [token, setToken] = useState(null);
  const searchParams = useSearchParams();
  const paramsToken = useSearchParams().get("token");
  const [emailverified, setEmailVerified] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const authUser = useAuthStore((state) => state.authUser);

  let userId= authUser?._id || authUser?.id;
  const verifyEmail = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/users/verifyemail", { token,userId });
      console.log(response.data);
      setEmailVerified(true);
    } catch (error) {
      console.log(error);
      setEmailVerified(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (paramsToken) {
      setToken(paramsToken);
    }
  }, []);
  useEffect(() => {
    if (token && token.length > 0) {
      verifyEmail();
    }
    console.log("Token in the verify email page", token);
  }, [token]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-[70%] h-full flex flex-col items-center justify-center">
        {loading ? (
          <Skeleton className="w-[200px] h-[250px]" />
        ) : emailverified ? (
          <>
            <h1 className="text-2xl font-bold text-gray-600">
              Email Verification Successfull
            </h1>
            <span>
              <Button
                onClick={() => {
                  router.push("/myprofile");
                }}
              >
                Change Password
              </Button>
            </span>
          </>
        ) : (
          <h1 className="text-2xl font-bold text-gray-600">
            Email Verification Failed
          </h1>
        )}
      </div>
    </div>
  );
};

export default page;
