import axios from "axios";

export type uploadType = "image" | "video";
export const getSignatureFromBackend = async (type: uploadType) => {
    const { data } = await axios.post("/api/upload/sign", { type });
    return data; // data.signature
};