import { useState } from "react";

export const useVideoParsing = (): { getVideoDuration: (file: File) => Promise<number>, loading: boolean } => {
    const [loading, setLoading] = useState(false);

    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            setLoading(true);
            const video = document.createElement('video');
            const url = URL.createObjectURL(file);
            video.src = url;
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const duration = Math.floor(video.duration);
                URL.revokeObjectURL(video.src);
                setLoading(false);
                resolve(Math.floor(duration));
            };
            video.onerror = () => {
                URL.revokeObjectURL(url);
                setLoading(false);
                reject(new Error('Failed to read video metadata'));
            };
        })
    }

    return { getVideoDuration, loading };
}