import { auth } from "@/auth";
import { logger } from "@/utils/logger/logger.node";
export const getDataFromToken = async (request) => {
    try {
        const session = await auth();
        logger.info("This is the Session in the getToken", { user: session?.user });
        return session?.user || null;
    }
    catch (error) {
        logger.error("Error getting session:", error);
        return null;
    }
};
