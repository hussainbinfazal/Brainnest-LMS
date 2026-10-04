export function uploadFolder(sub: string): string { //For client
    // Read the root folder from the environment
    const root = process.env.CLOUDINARY_UPLOAD_FOLDER;
    // Fail loudly instead of producing "undefined/..."
    if (!root) throw new Error("CLOUDINARY_UPLOAD_FOLDER is not set");
    // Join root and sub-folder
    return `${root}/${sub}`;
}