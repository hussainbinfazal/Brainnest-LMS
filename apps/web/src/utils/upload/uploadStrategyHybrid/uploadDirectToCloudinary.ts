import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { getSignatureFromBackend } from "../getSignatureFromBackend/getSignatureFromBackend";
import { CUploadResult, CuploadType, UploadOptions } from "@/types/client";
import axios from "axios";
import { getErrorMessage } from "@repo/shared";
import { UploadPurpose } from "@repo/shared";

type CloudinaryUploadResponse = {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    duration?: number;
    error?: { message?: string };
};

export async function uploadDirectToCloudinary(file: File, purpose: UploadPurpose, opts?: UploadOptions): Promise<CUploadResult> {
    try {
        if (!file) {
            throw new Error("No file provided for upload.");
        }
        const type: CuploadType | null = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
        if (!type) {
            throw new Error("Unsupported file type. Only images and videos are allowed.");
        };

        const generatedSignature = await getSignatureFromBackend(purpose);
        if (!generatedSignature) {
            throw new Error("Failed to get signature from Backend.");
        }
        const { signature,
            timestamp,
            cloudName,
            apiKey,
            folder,
            allowedFormats,
            tags,
            transformation } = generatedSignature;
        const formData = new FormData()
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("folder", folder);
        formData.append("signature", signature);
        formData.append("allowed_formats", allowedFormats);
        if (tags) formData.append("tags", tags);
        if (transformation) formData.append("transformation", transformation);

        const endPoint = `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
        const response = await axios.post<CloudinaryUploadResponse>(endPoint, formData, {
            signal: opts?.signal,
            onUploadProgress: (e) => {
                //e.total can be undefined, so fallback to the file size
                const total = e.total ?? file.size;
                opts?.onProgress?.(Math.min(99, Math.round(e.loaded / total) * 100))
            }
        });

        const data = response.data;
        if (data.error) {
            clientLogger.error("Cloudinary upload failed", { status: response.status, response: data });
            throw new Error(data.error.message || "Cloudinary upload failed");
        }
        clientLogger.info("File uploaded successfully to Cloudinary", { url: data.secure_url, public_id: data.public_id });
        opts?.onProgress?.(100) //Progress Completes here 
        return {
            url: data.secure_url,
            public_id: data.public_id,
            width: data.width,
            height: data.height,
            duration: data.duration,
        }



    } catch (error: unknown) {
        if (axios.isCancel(error)) throw error;
        if (axios.isAxiosError<CloudinaryUploadResponse>(error) && error.response?.data?.error?.message) {
            clientLogger.error("Direct Cloudinary upload error:", {
                status: error.response.status,
                error: error.response.data.error.message,
            });
            throw new Error(error.response.data.error.message);
        }
        const message = getErrorMessage(error, "Failed to upload file to Cloudinary");
        clientLogger.error('Direct Cloudinary upload error:', { error: message });
        throw new Error(message);
    }
}