export const UPLOAD_LIMITS = {
    SMALL: 50 * 1024 * 1024, // 50MB
}

interface IgetUploadStrategy {
    "direct": "direct",
    "chunked": "chunked",

}
export function getUploadStrategy(fileSize: number): keyof IgetUploadStrategy {
    if (fileSize <= UPLOAD_LIMITS.SMALL) {
        return "direct"
    }
    
    return "chunked"
}