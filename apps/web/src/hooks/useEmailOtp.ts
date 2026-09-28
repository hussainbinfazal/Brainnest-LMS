import axios from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";
import { useCallback, useEffect, useRef, useState } from "react";
import { sendEmailBodySchema, verifyEmailBodySchema } from "@repo/shared/client"
import { getErrorMessage } from "@repo/shared";
// });
type OtpStatus = "idle" | "sending" | "error" | "sent" | "cooldown";
type VerfiyStatus = "idle" | "verifying" | "error" | "verified";

export type ActionResult<TFail = {}> =
    | { ok: true }
    | ({ ok: false; message: string } & TFail);
type SendResult = ActionResult<{ retryAfterSeconds?: number }>
type VerfiyResult = ActionResult
export interface UseSendEmailOtpResult {
    status: OtpStatus;
    error: string | null;
    cooldownSeconds: number;
    sendOtp: () => Promise<SendResult>;
}
export interface UseVerifyEmailOtpResult {
    status: VerfiyStatus;
    error: string | null;
    cooldownSeconds: number;
    verifyOtp: () => Promise<VerfiyResult>;
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
    const sendOtp = useCallback(async (): Promise<SendResult> => {
        if (inFlightRef.current || status === "sending" || status === "cooldown") {
            return { ok: false, message: "Request in progress" }
        }
        const parsed = sendEmailBodySchema.safeParse({ email });
        if (!parsed.success) {
            const message: string = parsed?.error?.issues[0]?.message ?? "Invalid Email"
            clientLogger.info("Invalid Payload");
            return { ok: false, message };
        }
        inFlightRef.current = true;
        setStatus("sending");
        setError(null);
        try {
            await axios.post("/api/sendEmailOTP", { email });
            setStatus("sent");
            setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
            return { ok: true }
        } catch (error: unknown) {
            // console.log("This is the error in the catch block of send Email Otp Hook", error);
            let message: string = getErrorMessage(error, "Failed to send email OTP");
            clientLogger.error("Error sending email OTP:", { message });
            setStatus("error");
            setError(message);
            return { ok: false, message }
        } finally {
            inFlightRef.current = false;
        }
    }, [email]);

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
    const verifyOtp = useCallback(async (): Promise<VerfiyResult> => {
        if (inFlightRef.current) return { ok: false, message: "Verification in progress" };
        const parsed = verifyEmailBodySchema.safeParse({ email, otp });
        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message ?? "Invalid OTP"
            setStatus('error');
            setError(message)
            clientLogger.warn("Invalid Payload");
            return { ok: false, message };
        };
        inFlightRef.current = true;
        setStatus("verifying");
        setError(null);
        try {
            await axios.post("/api/verifyEmailOtp", { email, otp });
            setStatus("verified");
            setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
            return { ok: true }
        } catch (error: unknown) {
            // console.log("This is the error in verify Route", error)
            const message: string = getErrorMessage(error, "Email OTP verification failed");
            clientLogger.error("Error sending email OTP:", { message });
            setStatus("error");
            setError(message);
            return { ok: false, message }
        } finally {
            inFlightRef.current = false;
        }
    }, [email, otp]);

    return { status, error, cooldownSeconds, verifyOtp };
};



