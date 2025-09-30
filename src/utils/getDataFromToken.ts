import { auth } from "@/auth";
import type {Session} from "next-auth";

export const getDataFromToken = async (request: Request): Promise<Session["user"] | null> => {
    try {
        const session = await auth();
        console.log("This is the Session in the getToken:", session?.user);
        return session?.user || null;
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}