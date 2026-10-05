import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { uploadFileClient } from "@/utils/upload/uploadFile";
import { getErrorMessage, UploadPurpose } from "@repo/shared";
import { useState } from "react";
import { toast } from "sonner";




export function useFileUploadField() { //Hook to upload file
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>(''); ///Browser file name
    const [uploadError, setUploadError] = useState<any>(null) ///Upload Error Message for UI
    const [isVideoParsing, setIsVideoParsing] = useState<boolean>(false);
    const upload = async (file: File, purpose: UploadPurpose) => { //Upload file function that passed file to uploadFileClient
        setIsUploading(true);
        setFileName(file.name);
        try {
            const isVideo = file.type.startsWith('/video');
            let duration: number | undefined;
            if (isVideo) {
                duration = await getVideoDuration(file);
            };
            const result = await uploadFileClient(file, purpose);
            return isVideo && duration != undefined ? { ...result, duration } : result
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Upload Failed")
            const message = getErrorMessage(error, "Upload Failed");
            setUploadError(message);
            clientLogger.error(isVideoParsing ? "Video Parsing Failed" : "Upload Failed", message);
            return null
        } finally {
            setIsUploading(false);
        }
    };


    //Send the url of the video to get the duration and store vectors of this in ai service
    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            setIsVideoParsing(true);
            const video = document.createElement('video');
            const url = URL.createObjectURL(file);
            video.src = url;
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const duration = Math.floor(video.duration);
                URL.revokeObjectURL(video.src);
                setIsVideoParsing(false);
                resolve(Math.floor(duration));
            };
            video.onerror = () => {
                URL.revokeObjectURL(url);
                setIsVideoParsing(false);
                reject(new Error('Failed to read video metadata'));

            };
        })

    }
    return { upload, isUploading, fileName, uploadError, }
}