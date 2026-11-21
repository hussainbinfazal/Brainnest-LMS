"use client";

// Import React hooks and axios
import { useEffect, useState } from "react";
import axios from "axios";
import { clientLogger } from "";

// What the status route returns
type EmailStatus = {
    isVerified: boolean
};
type EmailVerifyState = {
    status: "idle" | "verifying" | "verified" | "failed";
    emailStatus?: EmailStatus;
};

// Poll the status route until the draft is ready or failed
export function useVerifyEmail(
    email: string,
): EmailStatus {
    // Local state with the current status and draft
    const [state, setState] = useState<EmailVerifyState>({ status: "idle" });
    // Restart polling whenever the pending id changes (new video uploaded)
    useEffect(() => {
        const controller = new AbortController(); //Kills the request if the component unmounts
        // Nothing to poll without an id
        if (!email) {
            setState({ status: "idle" });
            return;
        }
        // Guards against updating state after unmount or id change
        let cancelled = false;
        // Handle of the next scheduled poll
        let timer: ReturnType<typeof setTimeout>;
        // Safety cap: 120 polls x 5 s = 10 minutes
        // One poll
        const verifyEmail = async () => {
            console.log(
                "this is the email in the userEmailVerify Hook ",
                email,

            );
            try {
                // Ask the server for the current status (adjust to your successResponse shape)
                const res = await axios.get(
                    "/api/auth/verify-email",
                    {
                        body: { email }
                        signal: controller.signal,
                    }
                );
                console.log("This is the data on useLessonDraft Hook", res);
                // Ignore late responses
                if (cancelled) return;
                // Save status and draft
                setState(res.data);
                // The worker may not have created its transcript record when the first poll arrives.
                clientLogger.info("Email Verify status", {
                    email,
                    status: res.data.status,
                });
            } catch (verifyEmailError) {
                clientLogger.error("Failed to verify email", {
                    email,
                    error: verifyEmailError instanceof Error ? verifyEmailError : undefined,
                    message:
                        verifyEmailError instanceof Error ? verifyEmailError.message : "Unknown error",
                });
                // Network or server error: stop and show failed
                if (!cancelled) setState({ status: "failed" });
            }
        };
        // Show progress immediately
        setState({ status: "verifying" });
        // Start the first poll
        verifyEmail();
        // Cleanup when the id changes or the component unmounts
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [email]);
    // Expose the state to the component
    return state;
}
