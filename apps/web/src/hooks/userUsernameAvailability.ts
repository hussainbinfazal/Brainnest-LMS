import { useEffect, useState } from "react";

import axios, { AxiosError } from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";


type UsernameStatus = "idle" | "checking" | "available" | "taken";


export function useUsernameAvailability(username: string): UsernameStatus {
    const [status, setStatus] = useState<UsernameStatus>("idle");
    useEffect(() => {
        if (!username || username.length < 3) {
            setStatus("idle");
            return;
        };
        setStatus("checking");
        const timeout = setTimeout(async (): Promise<void> => {
            try {
                const params = new URLSearchParams(
                    {
                        username: username.trim()
                    }
                );
                const response = await axios.get(`/api/users/check-username?${params.toString()}`);
                setStatus(response.data.available ? "available" : "taken");
            } catch (error: unknown) {
                const axiosErr = error as AxiosError<{ message: string }>;
                console.error("Error checking username availability:", {
                    status: axiosErr.response?.status,
                    data: axiosErr.response?.data,       // <-- this has your real server message
                    message: axiosErr.message,
                });

                clientLogger.error("Error checking username availability:", { error });
                setStatus("idle");
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [username]);
    return status;

}