import { UploadPurpose } from "@repo/shared";
import axios from "axios";


export const getSignatureFromBackend = async (purpose: UploadPurpose) => {
    const { data } = await axios.post<{ data: {
        signature: string;
        timestamp: number;
        cloudName: string;
        apiKey: string;
        folder: string;
        resourceType?: string;
        allowedFormats: string;
        tags?: string;
        transformation?: string;
    } }>("/api/upload/sign", { purpose });
    return data.data;
};