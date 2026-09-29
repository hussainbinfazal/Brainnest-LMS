import { useEffect, useState } from "react";

import axios, { AxiosError } from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";
import { getErrorMessage } from "@repo/shared";


type UsernameStatus = "idle" | "checking" | "available" | "taken";


export function useUsernameAvailability(username: string) {
    const [status, setStatus] = useState<UsernameStatus>("idle");
    useEffect(() => {
        if (!username || username.length < 3) {
            setStatus("idle");
            return;
        };
        setStatus("checking");
        const controller = new AbortController()//Kills the request if the component unmounts
        const timeout = setTimeout(async () => {
            try {
                const params = new URLSearchParams(
                    {
                        username: username.trim()
                    }
                );
                const { data } = await axios.get(`/api/users/check-username`, { signal: controller.signal, params: params.toString() });
                setStatus(data.available ? "available" : "taken");
            } catch (error: unknown) {
                if (axios.isCancel(error)) return;
                const message: string = getErrorMessage(error, "Failed to check username");
                clientLogger.error("Error checking username availability:", { message });
                setStatus("idle");
            }
        }, 400);

        return () => { clearTimeout(timeout); controller.abort(); };
    }, [username]);
    return status;

}