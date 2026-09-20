import axios from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";
import { useCallback, useEffect, useRef, useState } from "react";
import { validateEmail } from "@/utils/phoneValidators";


type OtpStatus = "idle" | "sending" | "error" | "sent" | "cooldown";


interface UseSendEmailOtpResult {
    status: OtpStatus;
    error: string | null;
    cooldownSeconds: number;
    sendOtp: () => Promise<void>;
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
        if (!validateEmail(email)) {
            setStatus("error");
            setError("Invalid email format");
            return;
        };
        if (inFlightRef.current || status === "sending" || status === "cooldown") return
        inFlightRef.current = true;
        setStatus("sending");
        setError(null);
        try {
            await axios.post("/api/sendEmailOTP", { email });
            setStatus("sent");
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
            setError("Error sending email OTP");
        } finally {
            inFlightRef.current = false;
        }
    }, [email, status]);

    return { status, error, cooldownSeconds, sendOtp };
};



