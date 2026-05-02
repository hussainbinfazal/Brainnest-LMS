export const UPLOAD_LIMITS = {
    SMALL: 20 * 1024 * 1024, // 20MB
    LARGE: 100 * 1024 * 1024, // 500MB
}

interface IgetUploadStrategy {
    "direct": "direct",
    "chunked": "chunked",
    "backend": "backend"
}
export function getUploadStrategy(fileSize: number): keyof IgetUploadStrategy {
    if (fileSize <= UPLOAD_LIMITS.SMALL) {
        return "direct"
    }
    if (fileSize <= UPLOAD_LIMITS.LARGE) {
        return "chunked"
    }
    return "backend"
}