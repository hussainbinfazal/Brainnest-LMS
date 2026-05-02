import { clientLogger } from "../logger/clientLogger";

type uploadType = "image" | "video";



export async function uploadFileClient(file: File, type: uploadType) {
    if (type === "image" && !file.type.startsWith("image/")) {
        throw new Error("Invalid Image file.");
    }
    if (type === "video" && !file.type.startsWith("video/")) {
        throw new Error("Invalid video file.");
    }
    if (file.size > 50 * 1024 * 1024) {
        clientLogger.warn(`Large file, upload may take time`);
        const strategy = getUploadStrategy(file.size)
        switch (strategy) {
            case "direct":
                return uploadDirectlyToCloudinary(file, type);

            case "chunked":
                return uploadChunkedToCloudinary(file, type);

            case "backend":
                return uploadViaBackend(file, type)

        }

    }
