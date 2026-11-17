"use client";
import React, { JSX } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store/usersStore/useAuthStore";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const VerifyEmailPage = async (): Promise<JSX.Element> => {
  const [token, setToken] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const paramsToken = useSearchParams().get("token");
  const { data: session, status } = useSession();
  const authUser = useAuthStore((state) => state.authUser);
  const [emailverified, setEmailVerified] = useState<boolean>(false);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  let userId = authUser?._id ?? session?.user.id;
  const verifyEmail = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/users/verifyResetEmail", {
        token,
        userId,
      });
      // logger.info({ data: response.data }, "verifyEmail response");
      setEmailVerified(true);
    } catch (error: unknown) {
      // logger.error(error);
      setEmailVerified(false);
      toast.error("Something went wrong while verifying email");
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
    // logger.info({ token }, "Token in the verify email page");
  }, [token]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-[70%] h-full flex flex-col items-center justify-center">
        {loading ? (
          <Skeleton className="w-50 h-62.5" />
        ) : emailverified ? (
          <>
            <h1 className="text-2xl font-bold text-gray-600">
              Email Verification Successfull
            </h1>
            <span>
              <Button
                className=""
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

export default VerifyEmailPage;
