export const UPLOAD_LIMITS = {
    SMALL: 50 * 1024 * 1024, // 50MB
};
export function getUploadStrategy(fileSize) {
    if (fileSize <= UPLOAD_LIMITS.SMALL) {
        return "direct";
    }
    return "chunked";
}
