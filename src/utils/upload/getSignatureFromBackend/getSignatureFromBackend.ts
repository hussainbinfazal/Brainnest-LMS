import axios from "axios";

export type uploadType = "image" | "video";
export const getSignatureFromBackend = async (file: File, type: uploadType) => {
    const { data } = await axios.post("/api/upload/sign", { file, type });
    return data; // data.signature
};