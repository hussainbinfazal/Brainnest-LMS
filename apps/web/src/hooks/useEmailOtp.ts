import axios from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";
import { useCallback, useEffect, useRef, useState } from "react";
import { sendEmailBodySchema, verifyEmailBodySchema } from "@repo/shared/client"
// });
type OtpStatus = "idle" | "sending" | "error" | "sent" | "cooldown";
type VerfiyStatus = "idle" | "verifying" | "error" | "verified";

export interface UseSendEmailOtpResult {
    status: OtpStatus;
    error: string | null;
    cooldownSeconds: number;
    sendOtp: () => Promise<void>;
}
export interface UseVerifyEmailOtpResult {
    status: VerfiyStatus;
    error: string | null;
    cooldownSeconds: number;
    verifyOtp: () => Promise<void>;
}
const RESEND_COOLDOWN_SECONDS = 60; // server's cooldown TTL


export function useSendEmailOtp(email: string): UseSendEmailOtpResult {
    const [status, setStatus] = useState<OtpStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
    const inFlightRef = useRef(false);


    //Reset stale "sent/error" state if the user edits the email after a previous attempt
    useEffect(() => {
        setStatus("idle");
        setError(null);
        setCooldownSeconds(0)
    }, [email]);

    //Local countdown so the button stays disabled without polling the server every second
    useEffect(() => {
        if (cooldownSeconds <= 0) return;

        const id = setInterval(() => {
            setCooldownSeconds((s) => {
                if (s <= 1) {
                    setStatus("idle");
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(id);

    }, [cooldownSeconds])
    const sendOtp = useCallback(async () => {
        const parsed = sendEmailBodySchema.safeParse({ email });
        if (!parsed.success) {
            clientLogger.info("Invalid Payload");
            return;
        }
        if (inFlightRef.current || status === "sending" || status === "cooldown") return
        inFlightRef.current = true;
        setStatus("sending");
        setError(null);
        try {
            await axios.post("/api/sendEmailOTP", { email });
            setStatus("sent");
            setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        } catch (error: unknown) {
            console.log("This is the error in the catch block of send Email Otp Hook", error);
            let message: string = "Failed to send email OTP";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;

            } else if (error instanceof Error) {
                message = error.message;
            }
            console.log("This is the error in the catch block of send Email Otp Hook", error);
            clientLogger.error("Error sending email OTP:", { error, message });
            setStatus("error");
            setError("Error sending email OTP");
        } finally {
            inFlightRef.current = false;
        }
    }, [email, status]);

    return { status, error, cooldownSeconds, sendOtp };
};
export function useVerifyEmailOtp(email: string, otp: string,): UseVerifyEmailOtpResult {
    const [status, setStatus] = useState<VerfiyStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
    const inFlightRef = useRef(false);


    //Reset stale "verfiy/error" state if the user edits the email after a previous attempt
    useEffect(() => {
        setStatus("idle");
        setError(null);
    }, [otp]);

    //Local countdown so the button stays disabled without polling the server every second
    useEffect(() => {
        if (cooldownSeconds <= 0) return;

        const id = setInterval(() => {
            setCooldownSeconds((s) => {
                if (s <= 1) {
                    setStatus("idle");
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(id);

    }, [cooldownSeconds])
    const verifyOtp = useCallback(async () => {
        const parsed = verifyEmailBodySchema.safeParse({ email, otp });
        if (!parsed.success) {
            clientLogger.warn("Invalid Payload");
            return;
        };
        inFlightRef.current = true;
        setStatus("verifying");
        setError(null);
        try {
            await axios.post("/api/verifyEmailOTP", { email, otp });
            setStatus("verified");
            setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        } catch (error: unknown) {
            let message = "Something went wrong";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;

            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Something went wrong, while fetching the user", { message });
            clientLogger.error("Error sending email OTP:", { error, message });
            setStatus("error");
            setError("Error verifying email OTP");
        } finally {
            inFlightRef.current = false;
        }
    }, [otp, status]);

    return { status, error, cooldownSeconds, verifyOtp };
};



