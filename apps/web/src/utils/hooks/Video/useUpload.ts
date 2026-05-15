import axios from "axios";
import { useState } from "react"

export const useUpload = (): { uploadFile: (file: File) => Promise<string>, loading: boolean } => {
    const [loading, setLoading] = useState(false);
    const uploadFile = async (file: File): Promise<string> => {
        setLoading(true);
        const formData = new FormData()
        formData.append("file", file)
        const { data } = await axios.post("/api/upload", formData)
        setLoading(false)
        return data.filePath
    }
    return { uploadFile, loading }

}