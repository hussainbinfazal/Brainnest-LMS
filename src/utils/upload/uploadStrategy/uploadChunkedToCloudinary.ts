import { CuploadResult, CuploadType } from "@/types/client";
import { getSignatureFromBackend } from "../getSignatureFromBackend/getSignatureFromBackend";
import axios from "axios";
import { clientLogger } from "@/utils/logger/clientLogger";
import { uploadWithRetry } from "@/lib/helpers/retryHelper";

const CHUNK_SIZE:number = 5 * 1024 * 1024; // 5MB

export async function uploadChunkedToCloudinary(file: File, type: CuploadType): Promise<CuploadResult> {
    try {
        const key :string = `upload-${file.name}--${file.size}`;
        const saved = JSON.parse(localStorage.getItem(key) as string,) || {};
        let uploadedBytes : number = saved.uploadedBytes || 0;
        let uploadId : string = saved.uploadId
        let startIndex : number = saved.index || 0;
        let finalResponse: any = null;

        if (!uploadId) {
            const res = await axios.post("/api/upload/init", {
                fileName: file.name,
                fileSize: file.size,

            }, {
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = res.data;
            uploadId = data.uploadId;
        }
        const generatedSignature = await getSignatureFromBackend(type);
        const { signature, timestamp, cloudName, apiKey, folder } = generatedSignature;
        try {
            const statusRes = await axios.get(`/api/upload/progress/status/${uploadId}`);
            const serverData = statusRes.data;
            startIndex = Math.max(startIndex, serverData.lastChunkIndex || 0);
            uploadedBytes = Math.max(uploadedBytes, serverData.uploadedBytes || 0);
        } catch (error: any) {
            clientLogger.error("Error fetching upload progress status, starting from the beginning", { error: error instanceof Error ? error.message : "Unknown error" });
        }
        for (let i = startIndex, start = startIndex * CHUNK_SIZE; startIndex < CHUNK_SIZE; start += CHUNK_SIZE, i++) {
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const formData = new FormData();
            formData.append("file", chunk);
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp.toString());
            formData.append("folder", folder);
            formData.append("signature", signature);

            const headers: any = {
                "Content-Range": `bytes ${uploadedBytes}-${uploadedBytes + chunk.size - 1}/${file.size}`,
                "X-Unique-Upload-Id": uploadId
            }
            const response = await uploadWithRetry(() => axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, formData, {
                headers
            }), 3);
            const res = response.data;
            if (res.error) {
                clientLogger.error("Chunk upload failed", { status: res.status, response: res.data });
                throw new Error(res.data.error?.message || "Cloudinary upload failed");
            }
            if (res.done === true) {
                finalResponse = res;
            }

            uploadedBytes += chunk.size;
            localStorage.setItem(`upload-${file.name}--${file.size}`, JSON.stringify({
                uploadId,
                uploadedBytes,
                index: i + 1,

            }) as string)

            await axios.post("/api/upload/progress", {

                uploadId,
                uploadedBytes,
                index: i + 1,

            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            clientLogger.info(`Chunk ${i + 1} uploaded successfully`, { uploadedBytes, totalBytes: file.size });

        }
        await axios.post("/api/upload/complete", {

            uploadId,
            url: finalResponse.secure_url,

        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        localStorage.removeItem(key);
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