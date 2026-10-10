


export * from "./helper/getErrorMessage"
export const UPLOAD_PURPOSES = ["avatar", "thumbnail", "lecture-video", "preview-video"] as const;
// Union type derived from the array, so a new purpose is added in one place only
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];
export const MAX_FILE_SIZE: Record<UploadPurpose, number> = {
    avatar: 2 * 1024 * 1024,
    thumbnail: 5 * 1024 * 1024,
    "lecture-video": 100 * 1024 * 1024,
    "preview-video": 100 * 1024 * 1024,
};
export const PENDING_AVATAR_SUBFOLDER = "pending-avatars";
export const PENDING_PREVIEW_VIDEO_SUBFOLDER = "pending-preview-video";
export const PENDING_THUMBNAIL_SUBFOLDER = "pending-thumbnai"
export const PENDING_LECTURES_SUBFOLDER = "pending-lesson-lectures"
export const MAX_FILENAME_LENGTH = 255;
export const SESSION_TTL_SEC = 24 * 60 * 60;
export const MAX_ACTIVE_SESSIONS = 3;
export interface UploadPolicy {
    requiresAuth: boolean;
    //Sessions's user role must be in that list
    allowedRoles?: string[];
    ///Used in upload urls, not Signed
    resourceType: 'image' | 'video';
    topicFolder: string,
    //Sub folder under cloudianry folder
    folder: string,
    allowedFormats: string;
    transformation?: string;
    tags?: string;

}
export const UPLOAD_POLICIES: Record<UploadPurpose, UploadPolicy> = {
    //Registeration avatar, no session  exists yet
    avatar: { requiresAuth: false, resourceType: 'image', topicFolder: 'avatar', folder: PENDING_AVATAR_SUBFOLDER, allowedFormats: "jpg,jpeg,png,webp", transformation: "c_limit,w_512,h_512", tags: "pending_avatar" },
    ///Thumbnail uplaod route, session must exists
    thumbnail: {
        requiresAuth: true, allowedRoles: ['instructor', 'admin'
        ],
        topicFolder: 'course_cover_image',
        resourceType: "image", folder: PENDING_THUMBNAIL_SUBFOLDER, allowedFormats: "jpg,jpeg,png,webp",
        tags: "pending_thumbnail"
    },
    //Lecture video or lessons
    "preview-video": {
        requiresAuth: true, allowedRoles: ['instructor', 'admin'], resourceType: 'video',
        topicFolder: 'course_preview-video', folder: PENDING_PREVIEW_VIDEO_SUBFOLDER, allowedFormats: 'mp4,mov,webm',
        tags: "pending_preview_video"
    },
    'lecture-video': {
        requiresAuth: true, allowedRoles: ['instructor', 'admin'], resourceType: 'video',
        topicFolder: 'course_lectures',
        folder: PENDING_LECTURES_SUBFOLDER, allowedFormats: 'mp4,mov,webm',
        tags: "pending_lessons_lectures"
    }

};

export const RESOURCE_TYPE: Record<UploadPurpose, "image" | "video"> = { avatar: "image", thumbnail: "image", "lecture-video": "video", 'preview-video': 'video' };


export function uploadFolder(topicFolder: string, sub: string): string { //For client
    // Read the root folder from the environment
    const root = process.env.CLOUDINARY_UPLOAD_FOLDER;
    // Fail loudly instead of producing "undefined/..."
    if (!root) throw new Error("CLOUDINARY_UPLOAD_FOLDER is not set");
    // Join root and sub-folder
    return `${root}/${topicFolder}/${sub}/`;
}