/**
 * Redis Cache Keys Documentation
 * ================================
 * Format: namespace:id
 * 
 * All cache keys used throughout the Brainnest Turborepo project
 * Usage: getCached(namespace, id), setCached(namespace, id, value, ttl)
 * 
 * TTL Categories:
 * - SHORT (60s): Volatile data - session type data
 * - MEDIUM (15min): Semi-stable data - course listings, popular content
 * - LONG (1hour): Stable data - uploads, session data
 * - VERY_LONG (24hours): Rarely changes - static config, categories
 */

// ============================================================================
// COURSE CACHE KEYS
// ============================================================================

/** 
 * namespace: "Courses"
 * id: "all"
 * ttl: MEDIUM (15min)
 * Usage: List all available courses (public listing)
 * Set by: apps/web/src/lib/getCachedCourse.ts
 * Used by: Homepage, courses page, admin panel
 * Full Key: Courses:all
 */
export const COURSES_ALL = {
  namespace: "Courses",
  id: "all",
  ttl: "MEDIUM",
  description: "All available courses - public listing",
  usedIn: ["Homepage", "Courses Page", "Admin Panel"],
};

export const COURSES_FACETS = {
  namespace: "courses-facets",
  id: "category:language:level",
  ttl: "VERY_LONG",
  description: "Facet data for category, language, and level filters",
  usedIn: ["Courses Page", "Course Filter API"],
};

/**
 * namespace: "course"
 * id: courseId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: Single course details with instructor and category
 * Set by: apps/web/src/lib/getCachedCourse.ts
 * Used by: Course detail page, course API routes
 * Full Key: course:courseId
 */
export const COURSE_BY_ID = {
  namespace: "course",
  id: "courseId",
  ttl: "MEDIUM",
  description: "Single course details with instructor info and category",
  usedIn: ["Course Detail Page", "Course API"],
};

/**
 * namespace: "relatedCourses"
 * id: courseId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: Related courses based on category/instructor
 * Set by: apps/web/src/lib/getCachedCourse.ts
 * Used by: Course detail page (recommendations)
 * Full Key: relatedCourses:courseId
 */
export const RELATED_COURSES = {
  namespace: "relatedCourses",
  id: "courseId",
  ttl: "MEDIUM",
  description: "Related courses based on same category/instructor",
  usedIn: ["Course Detail Page"],
};

/**
 * namespace: "instructorOtherCourses"
 * id: instructorId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: All courses by a specific instructor
 * Set by: apps/web/src/lib/getCachedCourse.ts
 * Used by: Course detail page, instructor profile
 * Full Key: instructorOtherCourses:instructorId
 */
export const INSTRUCTOR_OTHER_COURSES = {
  namespace: "instructorOtherCourses",
  id: "instructorId",
  ttl: "MEDIUM",
  description: "All courses taught by a specific instructor",
  usedIn: ["Course Detail Page", "Instructor Profile"],
};

/**
 * namespace: "lessons:course"
 * id: courseId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: All lessons in a course
 * Set by: apps/web/src/lib/getCachedLessons.ts
 * Used by: Course detail page, lesson list
 * Full Key: lessons:course:courseId
 */
export const LESSONS_BY_COURSE = {
  namespace: "lessons:course",
  id: "courseId",
  ttl: "MEDIUM",
  description: "All lessons within a specific course",
  usedIn: ["Course Detail Page", "Lesson List"],
};

/**
 * namespace: "sections:course"
 * id: courseId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: All sections in a course
 * Set by: apps/web/src/lib/getCachedSections.ts
 * Used by: Course detail page, section list
 * Full Key: sections:course:courseId
 */
export const SECTIONS_BY_COURSE = {
  namespace: "sections:course",
  id: "courseId",
  ttl: "MEDIUM",
  description: "All sections/chapters in a specific course",
  usedIn: ["Course Detail Page", "Section List"],
};

/**
 * namespace: "topic"
 * id: topicId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: Topic details for a course
 * Set by: apps/web/src/lib/getCachedTopic.ts
 * Used by: Course detail page
 * Full Key: topic:topicId
 */
export const TOPIC_BY_ID = {
  namespace: "topic",
  id: "topicId",
  ttl: "MEDIUM",
  description: "Topic/Tag details for a course",
  usedIn: ["Course Detail Page"],
};

// ============================================================================
// CATEGORY CACHE KEYS
// ============================================================================

/**
 * namespace: "Category"
 * id: "all"
 * ttl: VERY_LONG (24hours)
 * Usage: All course categories with hierarchy
 * Set by: apps/web/src/lib/getCachedCategory.ts
 * Used by: Homepage, navigation, category filter
 * Full Key: Category:all
 */
export const CATEGORIES_ALL = {
  namespace: "Category",
  id: "all",
  ttl: "VERY_LONG",
  description: "All course categories with parent-child relationships",
  usedIn: ["Homepage", "Navigation", "Category Filter"],
};

// ============================================================================
// REVIEW CACHE KEYS
// ============================================================================

/**
 * namespace: "reviews:courses"
 * id: "all"
 * ttl: MEDIUM (15min)
 * Usage: All reviews across all courses
 * Set by: apps/web/src/lib/getCachedReviews.ts
 * Used by: Reviews section, homepage
 * Full Key: reviews:courses:all
 */
export const REVIEWS_ALL_COURSES = {
  namespace: "reviews:courses",
  id: "all",
  ttl: "MEDIUM",
  description: "All reviews from all courses",
  usedIn: ["Homepage", "Reviews Section"],
};

/**
 * namespace: "reviews:course"
 * id: courseId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: Reviews for a specific course
 * Set by: apps/web/src/lib/getCachedReviews.ts
 * Used by: Course detail page, reviews section
 * Full Key: reviews:course:courseId
 */
export const REVIEWS_BY_COURSE = {
  namespace: "reviews:course",
  id: "courseId",
  ttl: "MEDIUM",
  description: "All reviews for a specific course",
  usedIn: ["Course Detail Page", "Reviews Section"],
};

// ============================================================================
// USER COURSE & PROGRESS CACHE KEYS
// ============================================================================

/**
 * namespace: "userCourses"
 * id: userId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: All courses enrolled by a user
 * Set by: apps/web/src/lib/getCachedCourse.ts
 * Used by: User dashboard, my courses page
 * Full Key: userCourses:userId
 */
export const USER_COURSES_LIST = {
  namespace: "userCourses",
  id: "userId",
  ttl: "MEDIUM",
  description: "All courses enrolled by a specific user",
  usedIn: ["User Dashboard", "My Courses Page"],
};

/**
 * namespace: "userCourses"
 * id: userId-courseId (composite key format)
 * ttl: MEDIUM (15min)
 * Usage: Specific user's enrollment in a course (with like/dislike status)
 * Set by: apps/web/src/app/api/likeCourse/[courseId]/route.ts
 *         apps/web/src/app/api/dislikeCourse/[courseId]/route.ts
 * Invalidated by: Like/Dislike course operations
 * Used by: Course interaction (like/dislike)
 * Full Key: userCourses:userId-courseId
 */
export const USER_COURSE_DETAIL = {
  namespace: "userCourses",
  id: "userId-courseId",
  ttl: "MEDIUM",
  description: "User's enrollment status & interaction (like/dislike) in a course",
  usedIn: ["Course Interaction (Like/Dislike)"],
};

/**
 * namespace: "progress"
 * id: userId:courseId (composite key format with colon)
 * ttl: MEDIUM (15min)
 * Usage: User's progress in a course (lessons completed, percentage)
 * Set by: apps/web/src/app/api/progress/[courseId]/[lessonId]/route.ts
 *         apps/Worker/src/jobs/services/progress.service.ts
 * Invalidated by: Progress completion, course completion
 * Used by: Progress tracking, course completion
 * Full Key: progress:userId:courseId
 */
export const PROGRESS_BY_USER_COURSE = {
  namespace: "progress",
  id: "userId:courseId",
  ttl: "MEDIUM",
  description: "User's learning progress in a course (lessons completed, etc)",
  usedIn: ["Progress Tracking", "Course Completion"],
};

/**
 * namespace: "userCourse"
 * id: userId:courseId (variant format, used in Worker)
 * ttl: MEDIUM (15min)
 * Usage: User course mapping (alternative key format)
 * Invalidated by: Progress service in worker
 * Used by: Background jobs, progress reconciliation
 * Full Key: userCourse:userId:courseId
 */
export const USER_COURSE_MAPPING = {
  namespace: "userCourse",
  id: "userId:courseId",
  ttl: "MEDIUM",
  description: "User course mapping (worker variant)",
  usedIn: ["Background Jobs", "Progress Reconciliation"],
};

/**
 * namespace: "instructorStats"
 * id: instructorId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: Instructor statistics (total students, revenue, etc)
 * Set by: apps/web/src/lib/getCachedCourse.ts
 * Used by: Instructor dashboard, course detail page
 * Full Key: instructorStats:instructorId
 */
export const INSTRUCTOR_STATS = {
  namespace: "instructorStats",
  id: "instructorId",
  ttl: "MEDIUM",
  description: "Instructor statistics (students, ratings, revenue)",
  usedIn: ["Instructor Dashboard", "Course Detail Page"],
};

// ============================================================================
// CART CACHE KEYS
// ============================================================================

/**
 * namespace: "Cart"
 * id: userId (MongoDB ObjectId)
 * ttl: MEDIUM (15min)
 * Usage: User's shopping cart with selected courses
 * Set by: apps/web/src/app/cart/page.tsx
 * Used by: Cart page, checkout
 * Full Key: Cart:userId
 */
export const CART_BY_USER = {
  namespace: "Cart",
  id: "userId",
  ttl: "MEDIUM",
  description: "User's shopping cart with selected courses",
  usedIn: ["Cart Page", "Checkout"],
};

// ============================================================================
// UPLOAD CACHE KEYS
// ============================================================================

/**
 * namespace: "upload"
 * id: uploadId (unique session ID)
 * ttl: LONG (1hour)
 * Usage: File upload session data (progress, chunks, metadata)
 * Set by: apps/web/src/app/api/upload/progress/route.ts
 *         apps/web/src/app/api/upload/complete/route.ts
 * Used by: Course content upload, video upload progress
 * Full Key: upload:uploadId
 */
export const UPLOAD_SESSION = {
  namespace: "upload",
  id: "uploadId",
  ttl: "LONG",
  description: "File upload session data (chunks, metadata, progress)",
  usedIn: ["Course Content Upload", "Video Upload"],
};

// ============================================================================
// QUEUE/JOB KEYS (BullMQ)
// ============================================================================

/**
 * Queue Names (Used in apps/Worker/src/queue/)
 * These are handled by BullMQ and stored in Redis
 */
export const QUEUE_KEYS = {
  EMAIL: {
    name: "email",
    description: "Email sending queue",
    usedIn: ["Email notifications, OTP delivery"],
  },
  CERTIFICATE: {
    name: "certificate",
    description: "Certificate generation queue",
    usedIn: ["Certificate generation on course completion"],
  },
  PROGRESS: {
    name: "progress",
    description: "Progress tracking queue",
    usedIn: ["Progress updates and reconciliation"],
  },
  RECONCILE: {
    name: "reconcile",
    description: "Payment reconciliation queue",
    usedIn: ["Razorpay payment verification"],
  },
  INGEST: {
    name: "ingest",
    description: "Data ingestion queue (AI/embeddings)",
    usedIn: ["Vector DB ingestion, embeddings"],
  },
};

// ============================================================================
// SUMMARY TABLE
// ============================================================================

export const ALL_CACHE_KEYS = [
  COURSES_ALL,
  COURSE_BY_ID,
  RELATED_COURSES,
  INSTRUCTOR_OTHER_COURSES,
  LESSONS_BY_COURSE,
  SECTIONS_BY_COURSE,
  TOPIC_BY_ID,
  CATEGORIES_ALL,
  REVIEWS_ALL_COURSES,
  REVIEWS_BY_COURSE,
  USER_COURSES_LIST,
  USER_COURSE_DETAIL,
  PROGRESS_BY_USER_COURSE,
  USER_COURSE_MAPPING,
  INSTRUCTOR_STATS,
  CART_BY_USER,
  UPLOAD_SESSION,
  COURSES_FACETS
];

// ============================================================================
// QUICK REFERENCE TABLE
// ============================================================================

export const CACHE_KEYS_QUICK_REFERENCE = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                       REDIS CACHE KEYS - QUICK REFERENCE                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ KEY FORMAT: namespace:id                                                        ║
║ TTL OPTIONS: SHORT (60s) | MEDIUM (15min) | LONG (1h) | VERY_LONG (24h)        ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ COURSE MANAGEMENT                                                               ║
╟────────────────────────────────────────────────────────────────────────────────╢
║ Courses:all                          │ All courses        │ MEDIUM │ Homepage  ║
║ course:{courseId}                    │ Single course      │ MEDIUM │ Detail    ║
║ relatedCourses:{courseId}            │ Related courses    │ MEDIUM │ Detail    ║
║ instructorOtherCourses:{instructorId}│ Instructor's courses│MEDIUM │ Detail   ║
║ lessons:course:{courseId}            │ Course lessons     │ MEDIUM │ Detail    ║
║ sections:course:{courseId}           │ Course sections    │ MEDIUM │ Detail    ║
║ topic:{topicId}                      │ Topic details      │ MEDIUM │ Detail    ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ CATEGORY & REVIEWS                                                              ║
╟────────────────────────────────────────────────────────────────────────────────╢
║ Category:all                         │ All categories     │VERY_LONG│Navigation║
║ reviews:courses:all                  │ All reviews        │ MEDIUM │ Homepage  ║
║ reviews:course:{courseId}            │ Course reviews     │ MEDIUM │ Detail    ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ USER DATA                                                                       ║
╟────────────────────────────────────────────────────────────────────────────────╢
║ userCourses:{userId}                 │ User's courses     │ MEDIUM │ Dashboard ║
║ userCourses:{userId}-{courseId}      │ User's course stat │ MEDIUM │ Interact  ║
║ progress:{userId}:{courseId}         │ User's progress    │ MEDIUM │ Progress  ║
║ userCourse:{userId}:{courseId}       │ User course (alt)  │ MEDIUM │ Jobs      ║
║ instructorStats:{instructorId}       │ Instructor stats   │ MEDIUM │ Dashboard ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ CART & UPLOADS                                                                  ║
╟────────────────────────────────────────────────────────────────────────────────╢
║ Cart:{userId}                        │ User's cart        │ MEDIUM │ Checkout  ║
║ upload:{uploadId}                    │ Upload progress    │ LONG   │ Upload    ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ QUEUES (BullMQ)                                                                 ║
╟────────────────────────────────────────────────────────────────────────────────╢
║ bull:email:*                         │ Email jobs         │ N/A    │ Worker    ║
║ bull:certificate:*                   │ Certificate jobs   │ N/A    │ Worker    ║
║ bull:progress:*                      │ Progress jobs      │ N/A    │ Worker    ║
║ bull:reconcile:*                     │ Payment reconcile  │ N/A    │ Worker    ║
║ bull:ingest:*                        │ AI ingest jobs     │ N/A    │ Worker    ║
╚════════════════════════════════════════════════════════════════════════════════╝

KEY FORMAT VARIATIONS:
• Simple: namespace:id
  Example: Courses:all, course:507f1f77bcf86cd799439011

• Composite (hyphen): namespace:id1-id2
  Example: userCourses:507f1f77bcf86cd799439011-507f1f77bcf86cd799439012

• Composite (colon): namespace:id1:id2
  Example: progress:507f1f77bcf86cd799439011:507f1f77bcf86cd799439012

INVALIDATION PATTERNS:
• Invalidate single: invalidateCached(namespace, id)
• Invalidate all: invalidateCached(namespace) - wipes all keys matching "namespace:*"

USAGE LOCATIONS:
├── apps/web/src/lib/       (getCached*.ts files)
├── apps/web/src/app/api/   (route handlers)
├── apps/web/src/app/       (page components)
├── apps/Worker/src/jobs/   (background job processing)
└── packages/shared/src/config/redisConfig/  (cache helpers)
`;

export default CACHE_KEYS_QUICK_REFERENCE;
