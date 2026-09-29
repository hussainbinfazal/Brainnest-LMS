import { useEffect, useState } from "react";

import axios, { AxiosError } from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";
import { getErrorMessage } from "@repo/shared";


type UsernameStatus = "idle" | "checking" | "available" | "taken" | "error";


export function useUsernameAvailability(username: string): { status: UsernameStatus, error: string | null } {
    const [status, setStatus] = useState<UsernameStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (!username || username.length < 3) {
            setStatus("idle");
            return;
        };
        setStatus("checking");
        const controller = new AbortController()//Kills the request if the component unmounts
        const timeout = setTimeout(async (): Promise<void> => {
            try {
                const params = new URLSearchParams(
                    {
                        username: username.trim()
                    }
                );
                const { data } = await axios.get(`/api/users/check-username?${params.toString()}`, { signal: controller.signal });
                setStatus(data.available ? "available" : "taken");
            } catch (error: unknown) {
                if (axios.isCancel(error)) return
                const message: string = getErrorMessage(error, "Failed to check username");
                clientLogger.error("Error checking username availability:", { message });
                setStatus("idle");
                setError(message)
            }
        }, 400);

        return () => { clearTimeout(timeout); controller.abort() };
    }, [username]);
    return { status, error };

}