import { auth } from "@/auth";
import type { Session } from "next-auth";
import { logger } from "@/utils/logger/logger";

export const getDataFromToken = async (request: Request): Promise<Session["user"] | null> => {
    try {
        const session = await auth();
        logger.info("This is the Session in the getToken", { user: session?.user });
        return session?.user || null;
    } catch (error: any) {
        logger.error("Error getting session:", error);
        return null;
    }
}