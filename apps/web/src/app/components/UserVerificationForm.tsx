"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CEmailOtpSenderProps, CEmailOtpVerifierProps, COtpSenderProps, CResendOtpResponse, CSendOtpResponse, CVerifyOtpResponse } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";
import { cn } from "@/lib/utils";
import { validateEmail } from "@/utils/phoneValidators";
import { useSendEmailOtp, useVerifyEmailOtp } from "@/hooks/useEmailOtp";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,

} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export const verifyEmailOTPSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});
export const emailOtpSenderSchema = z.object({
  email: z.string().email().max(254).refine(validateEmail),

})
const verifyEmailForm = useForm<z.infer<typeof verifyEmailOTPSchema>>({ resolver: zodResolver(verifyEmailOTPSchema), defaultValues: { otp: "" } });
const sendEmailForm = useForm<z.infer<typeof emailOtpSenderSchema>>({ resolver: zodResolver(emailOtpSenderSchema), defaultValues: { email: "" } });

//Right now this functionality is disabled
// export const phoneOtpSender = ({ phoneNumber, setPhoneNumber, onOtpSent, className }: COtpSenderProps) => {
//   const handleSendOtp = async (): Promise<CSendOtpResponse | void> => {
//     try {
//       const response = await axios.post<CSendOtpResponse>("/api/send-otp", { phoneNumber });
//       // Show OTP in development mode
//       if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
//         toast.success(`Development Mode - Your OTP is: ${response.data.otp || 'Check console'}`);
//         // logger.debug({ otp: response.data.otp }, "Generated OTP (development)");
//       }
//       toast.success(response.data.message || "OTP sent successfully");
//       onOtpSent(); // Notify parent
//       return response.data
//     } catch (error: any) {
//       const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
//       clientLogger.error(errorMessage, error);
//       toast.error(error.response?.data?.message || "Failed to send OTP");
//     }
//   };

//   return (
//     <div className="mb-4">
//       <button
//         onClick={handleSendOtp}
//         className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//       >
//         Send OTP
//       </button>
//     </div>
//   );
// };

;

// Email OTP Components

///OTP Sender Component
export const EmailOtpSender = ({ email, onOtpSent, className }: CEmailOtpSenderProps) => {
  // const {
  //   status: sendStatus,
  //   error: sendError,
  //   cooldownSeconds: sendCooldown,
  //   sendOtp,
  // } = useSendEmailOtp(.watch("email"));
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const handleSendOtp = async (): Promise<CSendOtpResponse | void> => {
    if (!validateEmail(email) || isSending) return
    setIsSending(true);
    try {
      const { data } = await axios.post<CSendOtpResponse>("/api/sendEmailOTP", { email });
      toast.success(data.message || "Email OTP sent successfully");
      // Show OTP in development mode
      // if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      //   toast.success(`Development Mode - Your Email OTP is: ${response.data.otp || 'Check console'}`);
      //   // logger.debug({ otp: response.data.otp }, "Generated Email OTP (development)");
      // }
      toast.success(data.message || "Email OTP sent successfully");
    } catch (error: unknown) {
      let message = "Failed to send email OTP";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.message || message
      } else if (error instanceof Error) {
        message = error.message
      }
      clientLogger.error(message, error);
      toast.error("Failed to send email OTP");
      return
    } finally {
      setIsSending(false)
    }
    onOtpSent(); // Notify parent
  };

  return (
    <div className={cn("mb-4", className)}>
      <button
        onClick={handleSendOtp}
        className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
      >
        {isSending ? "Sending..." : "Send Email OTP"}
      </button>
    </div>
  );
};

export const EmailOtpVerifier = ({ email, onVerified, onChangeEmail, className }: CEmailOtpVerifierProps) => {
  const {
    formState: { errors: verifyEmailFormErrors },
  } = verifyEmailForm;
  const {
    status: verifyStatus,
    error: verifyError,
    cooldownSeconds: verifyCooldown,
    verifyOtp,
  } = useVerifyEmailOtp(verifyEmailForm.watch("otp"));
  const {
    status: resendStatus,
    error: resendError,
    cooldownSeconds: resendCooldown,
    sendOtp: resendOtp,
  } = useSendEmailOtp(email);
  const [resendCount, setResendCount] = useState<number>(0);
  const maxResendAttempts = 5;
  const watchOtp = verifyEmailForm.watch("otp");
  useEffect(() => {
    setResendCount(0)
  }, [email])


  const handleVerifyOtp = async (): Promise<void> => {
    try {

      await verifyOtp();
      toast.success("Email OTP verified");
      onVerified(); // Notify parent
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : error instanceof Error
          ? error.message
          : "Email OTP verification failed";
      clientLogger.error(message, { error });
      toast.error(message);

    }
  };

  const handleResendOtp = async (): Promise<CResendOtpResponse | void> => {
    if (resendCount >= maxResendAttempts) {
      toast.error(`Maximum ${maxResendAttempts} resend attempts reached`);
      return;
    };
    try {
      await resendOtp();
      toast.success("Email OTP resent successfully");
      setResendCount((c) => c + 1);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : error instanceof Error
          ? error.message
          : "Failed to resend email OTP";
      clientLogger.error(message, { error });
      toast.error(message);
    }
  };

  return (
    <div className={cn("mb-4", className)}>
      <Form {...verifyEmailForm}>
        <form onSubmit={verifyEmailForm.handleSubmit(handleVerifyOtp)}>
          <div className="flex justify-between items-center mb-2"
          >
            <span className="text-sm text-gray-600">OTP sent to: {email}</span>
            <button
              type="button"
              onClick={onChangeEmail}
              disabled={verifyStatus === "verifying" || verifyStatus === "verified"}
              className="text-purple-500 text-sm hover:underline"
            >
              Change Email
            </button>
          </div>

          <FormField
            control={verifyEmailForm.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter OTP</FormLabel>
                <FormControl>
                  <Input className='w-full border px-3 py-2 rounded mb-2'
                    type='text' inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"{...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {verifyError && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {verifyError}
            </p>
          )}
          <Button
            size='default'
            variant='default'
            type='submit'
            disabled={watchOtp.length !== 6}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {verifyStatus}
          </Button>

          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Resend attempts: {resendCount}/{maxResendAttempts}</span>
            {resendCooldown > 0 && <span>Resend in {resendCooldown}s</span>}
          </div>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || resendCount >= maxResendAttempts || verifyStatus === 'verifying' || verifyStatus === 'verified'}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend Email OTP after (${resendCooldown}s)` : 'Resend Email OTP'}
          </button>
        </form>
      </Form>
    </div>
  );
};




