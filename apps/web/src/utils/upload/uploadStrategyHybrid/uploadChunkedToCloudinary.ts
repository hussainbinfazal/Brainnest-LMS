import { CUploadResult, CuploadType } from "@/types/client";
import { getSignatureFromBackend } from "../getSignatureFromBackend/getSignatureFromBackend";
import axios from "axios";
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { uploadWithRetry } from "@/lib/helpers/retryHelper";
import { getErrorMessage } from "@repo/shared";
import { RESOURCE_TYPE, UploadPurpose } from "@repo/shared";

const CHUNK_SIZE: number = 5 * 1024 * 1024; // 5MB
type SavedUpload = { uploadId: string; nextIndex: number; uploadedBytes: number; result?: any };
// Local Storage getters and setters
function loadSaved(key: string): SavedUpload | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as SavedUpload) : null;
    } catch {
        return null;
    }
};
function saveState(key: string, state: SavedUpload) {
    ;

    try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* quota / private mode */ }
}

export async function uploadChunkedToCloudinary(file: File, purpose: UploadPurpose, opts?: { onProgress?: (percent: number) => void; signal?: AbortSignal }): Promise<CUploadResult> {
    const key: string = `upload:${file.name}:${file.size}:${file.lastModified}`;
    try {
        const saved = loadSaved(key); /// Load the saved state from local storage with the key
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE); /// Calculate the total number of chunks
        let uploadedBytes = saved?.uploadedBytes || 0; /// Initialize the uploaded bytes, this is used to track the progress of how many bytes have been uploaded
        let uploadId = saved?.uploadId /// Initialize the uploadId
        let startIndex = saved?.nextIndex || 0; /// Initialize the startIndex
        let finalResponse: any = saved?.result ?? null; /// Initialize the finalResponse
        let type = RESOURCE_TYPE[purpose]
        if (!uploadId) {
            const res = await axios.post("/api/upload/init", {   //// Initialize the upload session
                fileName: file.name,
                fileSize: file.size,
                purpose

            }, {
                signal: opts?.signal, //Pass the signal;

            });

            const data = res.data; /// Extract the uploadId from the response
            uploadId = data.uploadId as string; //// Set the uploadId
        }
        const generatedSignature = await getSignatureFromBackend(purpose);  /// Get the signature from backend
        if (!generatedSignature) throw new Error("Failed to get signature from backend.");
        const { signature, timestamp, cloudName, apiKey, folder, allowedFormats, tags } = generatedSignature/// Extract the signature, timestamp, cloudName, apiKey, and folder from the signature
        try {
            // const statusRes = await axios.get(`/api/upload/progress/status/${uploadId}`);  /// Get the status of the upload
            // const serverData = statusRes.data; /// Extract the data from the response
            // startIndex = Math.max(startIndex, serverData.lastChunkIndex || 0); /// Set the startIndex
            // uploadedBytes = Math.max(uploadedBytes, serverData.uploadedBytes || 0); /// Set the uploadedBytes
        } catch (error: unknown) {
            clientLogger.error("Error fetching upload progress status, starting from the beginning", { error: error instanceof Error ? error.message : "Unknown error" });
        }
        for (let i = startIndex; i < totalChunks; i++) {
            let start = i * CHUNK_SIZE; /// Calculate the start position
            const end = Math.min(start + CHUNK_SIZE, file.size); /// Calculate the end position 
            const chunk = file.slice(start, end); /// Slice the file into chunks
            const formData = new FormData();/// Create a new FormData object
            formData.append("file", chunk);/// Append the chunk to the FormData
            formData.append("api_key", apiKey);/// Append the apiKey to the FormData
            formData.append("timestamp", timestamp.toString());/// Append the timestamp to the FormData
            formData.append("folder", folder); /// Append the folder to the FormData
            formData.append("signature", signature); /// Append the signature to the FormData;
            formData.append("allowed_formats", allowedFormats);
            if (tags) formData.append("tags", tags);
            formData.append("resource_type", type);

            const headers: any = {
                "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
                "X-Unique-Upload-Id": uploadId
            }; /// Set the headers
            const response = await uploadWithRetry(() => axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, formData, {

                headers,
                signal: opts?.signal
            }), 3); //// Upload the chunk with retry upto 3 times
            const res = response.data;
            if (res.error) { /// if there is an error 
                clientLogger.error("Chunk upload failed", { status: res.status, response: res.data });
                throw new Error(res.data.error?.message || "Cloudinary upload failed");
            }
            if (res.done === true) {
                finalResponse = res;
            }

            const isLast = i === totalChunks - 1;  ///Check if this is the last chunk
            if (isLast) finalResponse = res; ///Set the finalResponse
            uploadedBytes += chunk.size;  ///Update the uploaded bytes
            saveState(key, { ///Save the state in localstorage
                uploadId,
                uploadedBytes,
                nextIndex: i + 1,
                result: isLast ? finalResponse : null

            });
            ///Clean up backend progress route also 
            opts?.onProgress?.(Math.round((end / file.size) * 100));
            clientLogger.info(`Chunk ${i + 1} uploaded successfully`, { uploadedBytes, totalBytes: file.size });

        }

        if (!finalResponse?.secure_url) { ///If the final response is not available
            localStorage.removeItem(key); ///Remove the saved state
            throw new Error("Cloudinary upload failed");
        }
        await axios.post("/api/upload/complete", { ///Complete the upload

            uploadId,
            url: finalResponse.secure_url,

        });

        localStorage.removeItem(key); ///Remove the saved state
        return {
            url: finalResponse.secure_url,
            public_id: finalResponse.public_id,
            width: finalResponse.width,
            height: finalResponse.height,
            duration: finalResponse.duration

        }
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const s = error.response?.status;
            if (![401, 403, 429].includes(Number(s))) localStorage.removeItem(key);
        }
        const message = getErrorMessage(error, 'Chunked Cloudinary upload error');
        // clientLogger.error('Chunked Cloudinary upload error:', { error: message });
        throw error ///Throw the error
    }
};
