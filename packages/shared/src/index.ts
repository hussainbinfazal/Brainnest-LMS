


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

export const MAX_FILENAME_LENGTH = 255;
export const SESSION_TTL_SEC = 24 * 60 * 60;
export const MAX_ACTIVE_SESSIONS = 3;
export interface UploadPolicy {
    requiresAuth: boolean;
    //Sessions's user role must be in that list
    allowedRoles?: string[];
    ///Used in upload urls, not Signed
    resourceType: 'image' | 'video';
    //Sub folder under cloudianry folder
    folder: string,
    allowedFormats: string;
    transformation?: string;
    tags?: string;

}
export const UPLOAD_POLICIES: Record<UploadPurpose, UploadPolicy> = {
    //Registeration avatar, no session  exists yet
    avatar: { requiresAuth: false, resourceType: 'image', folder: PENDING_AVATAR_SUBFOLDER, allowedFormats: "jpg,jpeg,png,webp", transformation: "c_limit,w_512,h_512", tags: "pending_avatar" },
    ///Thumbnail uplaod route, session must exists
    thumbnail: {
        requiresAuth: true, allowedRoles: ['instructor', 'admin'
        ],
        resourceType: "image", folder: "thumbnails", allowedFormats: "jpg,jpeg,png,webp"
    },
    //Lecture video or lessons
    "preview-video": {
        requiresAuth: true, allowedRoles: ['instructor', 'admin'], resourceType: 'video', folder: 'previewVideo', allowedFormats: 'mp4,mov,webm'
    },
    'lecture-video': {
        requiresAuth: true, allowedRoles: ['instructor', 'admin'], resourceType: 'video',
        folder: 'lectures', allowedFormats: 'mp4,mov,webm'
    }

};

export const RESOURCE_TYPE: Record<UploadPurpose, "image" | "video"> = { avatar: "image", thumbnail: "image", "lecture-video": "video", 'preview-video': 'video' };