import { CuploadResult, CuploadType } from "@/types/client";
import { getSignatureFromBackend } from "../getSignatureFromBackend/getSignatureFromBackend";
import axios from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadChunkedToCloudinary(file: File, type: CuploadType): Promise<CuploadResult> {
    try {
        function createChunk(file: File): Blob[] | null {
            const chunks = []
            let start: number = 0;
            while (start < file.size) {
                const end = Math.min(start + CHUNK_SIZE, file.size);
                chunks.push(file.slice(start, end))
                start = end;
            }
            return chunks
        }
        const chunks = createChunk(file);
        let uploadedBytes = 0;
        let uploadId = null;
        let finalResponse: any = null;

        const generatedSignature = await getSignatureFromBackend(type);
        const { signature, timestamp, cloudName, apiKey, folder } = generatedSignature;

        for (let i = 0; i < chunks!.length; i++) {
            const chunk = chunks![i];
            const formData = new FormData();
            formData.append("file", chunk);
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp.toString());
            formData.append("folder", folder);
            formData.append("signature", signature);


            const headers: any = {
                "Content-Range": `bytes ${uploadedBytes}-${uploadedBytes + chunk.size - 1}/${file.size}`
            }
            if (uploadId) {
                headers["X-Unique-Upload-Id"] = uploadId;
            } else {
                uploadId = crypto.randomUUID();
                headers["X-Unique-Upload-Id"] = uploadId;
            }
            const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, formData, {
                headers
            });

            if (res.data.error) {
                clientLogger.error("Chunk upload failed", { status: res.status, response: res.data });
                throw new Error(res.data.error?.message || "Cloudinary upload failed");
            }
            if (res.data.done === true) {
                finalResponse = res.data;
            }
            uploadedBytes += chunk.size;
            clientLogger.info(`Chunk ${i + 1}/${chunks!.length} uploaded successfully`, { uploadedBytes, totalBytes: file.size });


        }
        if (!finalResponse) {
            throw new Error("Upload incomplete");
        }
        return {
            url: finalResponse.secure_url,
            public_id: finalResponse.public_id,
            width: finalResponse.width,
            height: finalResponse.height,
            duration: finalResponse.duration

        }
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        clientLogger.error('Chunked Cloudinary upload error:', { error: message });
        throw new Error(message);
    }
}