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
export function uploadFolderServer(sub: string): string {
    // Read the root folder from the environment
    const root = process.env.CLOUDINARY_UPLOAD_FOLDER;
    // Fail loudly instead of producing "undefined/..."
    if (!root) throw new Error("CLOUDINARY_UPLOAD_FOLDER is not set");
    // Join root and sub-folder
    return `${root}/${sub}`;
}