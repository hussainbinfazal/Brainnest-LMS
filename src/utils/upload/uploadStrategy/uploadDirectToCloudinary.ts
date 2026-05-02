import { clientLogger } from "@/utils/logger/clientLogger";
import { getSignatureFromBackend, uploadType, uploadType } from "../getSignatureFromBackend/getSignatureFromBackend";
import { CuploadResult } from "@/types/client";


export async function uploadDirectToCloudinary(file: File): Promise<CuploadResult> {
    try {
        if (!file) {
            return Promise.reject(new Error("No file provided for upload."));
        }
        const type : uploadType | null = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
        if (!type) {
            throw new Error("Unsupported file type. Only images and videos are allowed.");
        }
        const generatedSignature = await getSignatureFromBackend(file, type);
        if (!generatedSignature) {
            throw new Error("Failed to get signature from Backend.");
        }
        const { signature, timestamp, cloudName, apiKey, folder, resourceType } = generatedSignature;
        const formData = new FormData()
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("folder", folder);
        formData.append("signature", signature);

        const endPoint = type === "image" ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` : `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

        const response = await fetch(endPoint, {
            method: "POST",
            body: formData,
        })
        const data = await response.json();
        if (!response.ok) {
            clientLogger.error("Cloudinary upload failed", { status: response.status, response: data });
            throw new Error(data.error?.message || "Cloudinary upload failed");
        }
        return {
            url: data.secure_url,
            public_id: data.public_id,
            width: data.width,
            height: data.height,
            duration: data.duration,
        }




    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        clientLogger.error('Direct Cloudinary upload error:', { error: message });
        throw new Error(message);
    }
}