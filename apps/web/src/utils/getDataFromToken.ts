import { auth } from "@/auth";
import type { Session } from "next-auth";
import { logger } from "@/utils/logger/logger.node";
import { getSession } from "@/dev/auth-helper";

export const getDataFromToken = async (request: Request): Promise<Session["user"] | null> => {
    try {
        // const session = await auth(); // Use auth() to get the session in production
        const session = await getSession() // Use getSession() to get the session in development
        logger.info("This is the Session in the getToken", { user: session?.user });
        return session?.user || null;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error getting session:", { error, message });
        return null;
    }
}