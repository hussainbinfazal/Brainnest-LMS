import cloudinary from "@/lib/cloudinary";
import { logger } from "@/utils/logger/logger";
import { writeFile, unlink } from "fs/promises";
import os from "os";
import path from "path";

interface uploadToCloudinaryParams {
    fileBuffer: Buffer;
    filename: string;
    userId: string;
}


export async function uploadToCloudinary({ fileBuffer, filename, userId }: uploadToCloudinaryParams) {
    try {
        const tempPath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
        await writeFile(tempPath, fileBuffer);
        const result = await cloudinary.uploader.upload(tempPath, {
            resource_type: "auto",
            folder: "nextjs_uploads",
        })
        await unlink(tempPath);
        logger.info("File uploaded to Cloudinary");
        return result.secure_url

    } catch (error: any) {
        logger.error(error.response.data.message || error.message);
        throw error
    }
}