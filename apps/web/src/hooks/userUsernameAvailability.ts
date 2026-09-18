import { useEffect, useState } from "react";

import axios from "axios";
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
        const timeout = setTimeout(async () => {
            try {
                const response = await axios.get(`/api/users/check-username?username=${username}`);
                setStatus(response.data.available ? "available" : "taken");
            } catch (error: unknown) {
                clientLogger.error("Error checking username availability:", { error });
                setStatus("idle");
            }
        }, 400);

        return () => clearTimeout(timeout);
    })
    return status;

}