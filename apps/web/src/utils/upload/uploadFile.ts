import { getUploadStrategy } from "@/config/uploadConfig/upload";
import { clientLogger } from "../logger/clientLogger";
import { uploadChunkedToCloudinary } from "./uploadStrategyHybrid/uploadChunkedToCloudinary";
import { uploadDirectToCloudinary } from "./uploadStrategyHybrid/uploadDirectToCloudinary";

type uploadType = "image" | "video";



export async function uploadFileClient(file: File, type: uploadType) {
    if (type === "image" && !file.type.startsWith("image/")) {
        throw new Error("Invalid Image file.");
    }
    if (type === "video" && !file.type.startsWith("video/")) {
        throw new Error("Invalid video file.");
    }
    if (file.size <= 100 * 1024 * 1024) {
        clientLogger.warn(`Large file, upload may take time`);
        const strategy = getUploadStrategy(file.size)
        switch (strategy) {
            case "direct":
                return uploadDirectToCloudinary(file);

            case "chunked":
                return uploadChunkedToCloudinary(file, type);

            default:
                throw new Error("No valid upload strategy found.");
        }
    }

}
