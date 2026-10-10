


export * from "./helper/getErrorMessage"
// Union type derived from the array, so a new purpose is added in one place only
export const MAX_FILE_SIZE: Record<UploadPurpose, number> = {
    avatar: 2 * 1024 * 1024,
    thumbnail: 5 * 1024 * 1024,
    "lecture-video": 100 * 1024 * 1024,
    "preview-video": 100 * 1024 * 1024,
    "lecture_preview-video": 100 * 1024 * 1024,
};
export const PENDING_AVATAR_SUBFOLDER = "pending-avatars";
export const PENDING_PREVIEW_VIDEO_SUBFOLDER = "pending-preview-video";
export const PENDING_THUMBNAIL_SUBFOLDER = "pending-thumbnai"
export const PENDING_LECTURES_SUBFOLDER = "pending-lesson-lectures"
export const PENDING_PREVIEW_LECTURES_SUBFOLDER = "pending-preview-lesson-lectures"

export const TOPIC_FOLDER: Record<UploadPurpose, string> = {
    avatar: 'avatar',
    thumbnail: 'course_cover_image',
    "lecture-video": 'course_preview-video',
    "preview-video": 'course_preview-video',
    'lecture_preview-video':
        'course_preview_lesson-video'

}
export const TOPIC_TAGS: Record<UploadPurpose, string> = {
    avatar: 'pending_avatar',
    thumbnail: 'pending_thumbnail',
    "lecture-video": 'pending_lessons_lectures ',
    "preview-video": 'pending_preview_video',
    'lecture_preview-video':
        `course_preview_lesson-video`

}
export const MAX_FILENAME_LENGTH = 255;
export const SESSION_TTL_SEC = 24 * 60 * 60;
export const MAX_ACTIVE_SESSIONS = 3;


export const RESOURCE_TYPE: Record<UploadPurpose, "image" | "video"> = { avatar: "image", thumbnail: "image", "lecture-video": "video", 'preview-video': 'video', 'lecture_preview-video': 'video' };


export function uploadFolder(folder: string, subFolder: string): string { //For client
    // Read the root folder from the environment
    const root = process.env.CLOUDINARY_UPLOAD_FOLDER;
    // Fail loudly instead of producing "undefined/..."
    if (!root) throw new Error("CLOUDINARY_UPLOAD_FOLDER is not set");
    // Join root and sub-folder
    return `${root}/${folder}/${subFolder}/`;
}


// One megabyte in bytes, so sizes below read as "2 * MB"
const MB = 1024 * 1024;

// Settings shared by every image upload
const IMAGE = {
    // Cloudinary resource type
    resourceType: "image",
    // Array instead of a comma string, so you can validate with .includes()
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
} as const;

// Settings shared by every video upload
const VIDEO = {
    // Cloudinary resource type
    resourceType: "video",
    // Allowed video extensions
    allowedFormats: ["mp4", "mov", "webm"],
    // All videos share the same size limit, change it here once
    maxSize: 100 * MB,
} as const;

// Settings shared by every upload that needs a logged-in session
const INSTRUCTOR_ONLY = {
    // A session must exist
    requiresAuth: true,
    // Roles allowed to upload
    allowedRoles: ["instructor", "admin"],
} as const;

// Shape every policy must follow
export interface UploadPolicy {
    // Whether a logged-in session is needed
    requiresAuth: boolean;
    // Roles allowed, only checked when requiresAuth is true
    allowedRoles?: readonly string[];
    // Cloudinary resource type
    resourceType: "image" | "video";
    // Max file size in bytes
    maxSize: number;
    // Top-level Cloudinary folder
    folder: string;
    // Pending sub-folder under the topic folder
    subFolder: string;
    // Allowed file extensions
    allowedFormats: readonly string[];
    // Optional Cloudinary transformation
    transformation?: string;
    // Cloudinary tag used to find pending files later
    tags: string;
}

// THE single source of truth. `satisfies` checks the shape but keeps the exact keys
export const UPLOAD_POLICIES = {
    // Registration avatar, no session exists yet
    avatar: {
        // Image defaults
        ...IMAGE,
        allowedRoles: ['student', "instructor", "admin"],
        // No login yet during registration
        requiresAuth: false,
        // Only this entry needs its own size
        maxSize: 2 * MB,
        // Top-level folder
        folder: TOPIC_FOLDER['avatar'],
        // Pending sub-folder
        subFolder: PENDING_AVATAR_SUBFOLDER,
        // Resize on upload
        transformation: "c_limit,w_512,h_512",
        // Tag for cleanup
        tags: "pending_avatar",
    },
    // Course thumbnail
    thumbnail: {
        // Image defaults
        ...IMAGE,
        // Auth and role defaults
        ...INSTRUCTOR_ONLY,
        // Thumbnail size limit
        maxSize: 5 * MB,
        // Top-level folder
        folder: TOPIC_FOLDER['thumbnail'],
        // Fixed the "thumbnai" typo
        subFolder: PENDING_THUMBNAIL_SUBFOLDER,
        // Tag for cleanup
        tags: TOPIC_TAGS['thumbnail'],
        transformation: "c_limit,w_1024,h_576",
    },
    // Course preview video
    "preview-video": {
        // Video defaults, including size
        ...VIDEO,
        // Auth and role defaults
        ...INSTRUCTOR_ONLY,
        // Top-level folder
        folder: TOPIC_FOLDER['preview-video'],
        // Pending sub-folder
        subFolder: PENDING_PREVIEW_VIDEO_SUBFOLDER,
        // Tag for cleanup
        tags: TOPIC_TAGS['preview-video'],
        transformation: "c_limit,w_1024,h_576",
    },
    // Lecture video
    "lecture-video": {
        // Video defaults, including size
        ...VIDEO,
        // Auth and role defaults
        ...INSTRUCTOR_ONLY,
        // Top-level folder
        folder: TOPIC_FOLDER['lecture-video'],
        // Pending sub-folder
        subFolder: PENDING_LECTURES_SUBFOLDER,
        // Tag for cleanup
        tags: TOPIC_TAGS['lecture-video'],
        transformation: "c_limit,w_1024,h_576",
    },
    // Lecture preview video
    "lecture_preview-video": {
        // Video defaults, including size
        ...VIDEO,
        // Auth and role defaults
        ...INSTRUCTOR_ONLY,
        // Top-level folder
        folder: TOPIC_FOLDER['lecture_preview-video'],
        // Own sub-folder, it was a copy of the lecture one before
        subFolder: PENDING_PREVIEW_LECTURES_SUBFOLDER,
        // Tag for cleanup
        tags: TOPIC_TAGS['lecture_preview-video'],
        transformation: "c_limit,w_1024,h_576",
    },
} as const satisfies Record<string, UploadPolicy>;

// Union type comes from the object keys, add a purpose once and it appears everywhere
export type UploadPurpose =
    | "avatar"
    | "thumbnail"
    | "lecture-video"
    | "preview-video"
    | "lecture_preview-video";
// Array of purposes, for runtime validation of user input
export const UPLOAD_PURPOSES = Object.keys(UPLOAD_POLICIES) as UploadPurpose[];

// Lookup helper that returns the wide UploadPolicy type
export const getPolicy = (purpose: UploadPurpose): UploadPolicy => UPLOAD_POLICIES[purpose];