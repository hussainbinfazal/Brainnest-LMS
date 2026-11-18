import axios from "axios";
import { logger } from "../server";

export async function passJobToWorker(url: string, body: Record<string, unknown>) {
    try {
        const workerUrl = process.env.WORKER_URL;
        const internalSecret = process.env.INTERNAL_AUTH;
        if (!workerUrl || !internalSecret) {
            throw new Error("WORKER_URL and INTERNAL_AUTH_SECRET must be configured");
        }
        const Response = await axios.post(`${workerUrl}/${url}`, body, { headers: { "x-internal-secret": internalSecret }, timeout: 10_000 });
        logger.info("Email sent successfully");
        return {
            ok: true,
            data: Response,
            status: Response.status
        }
    } catch (sendJobError: unknown) {
        return {
            ok: false,
            error: sendJobError,
            status: 500
        }
    }
}