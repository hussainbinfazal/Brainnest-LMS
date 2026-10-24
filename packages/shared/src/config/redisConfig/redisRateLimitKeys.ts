// export const OTP_SEND_IP = {
//   max: 5,
//   windowSec: 60,
// } as const;

import { id } from "zod/v4/locales";

export const OTP_SEND_EMAIL_IP_KEY = {
  namespace: 'limit-otp-send:ip',
  id: 'ip',
  max: 5,
  windowSec: 15 * 60,   // 900 — matches the cost of a real email send
  description: 'Rate limit IPs on the send-email-OTP route',
  usedIn: ['User Verification'],
} as const;

export const OTP_VERIFY_EMAIL_IP_KEY = {
  namespace: 'limit-otp-verify-email:ip',
  id: 'ip',
  max: 30,
  windowSec: 15 * 60,   // consistent window with send, easier to reason about
  description: 'Rate limit IPs on the verify-email-OTP route',
  usedIn: ['User Verification'],
} as const;

export const INTERNAL_AUTH_IP_KEY = {
  namespace: 'limit-internal-auth:ip',
  id: 'ip',
  max: 300,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Guards worker routes against secret brute-forcing from a given IP',
  usedIn: ['Authentication'],
} as const;
export const GLOBAL_IP_KEY = {
  namespace: 'limit-global:ip',
  id: 'ip',
  max: 100,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Guard api routes against brute-forcing from a given IP',
  usedIn: ['Global Rate Limiting'],
} as const;

export const UPDATE_TO_INSTRUCTOR_IP_KEY = {
  namespace: 'limit-update-to-instructor:ip',
  id: 'ip',
  max: 30,
  windowSec: 60,
  description: 'Backstop against anonymous spam of update to instructor from one IP',
  usedIn: ['Update to Instructor Rate Limiting'],
}
export const UPDATE_TO_INSTRUCTOR_USER_KEY = {
  namespace: 'limit-update-to-instructor:user',
  id: 'userId',
  max: 30,
  windowSec: 60,
  description: 'Backstop against anonymous spam of update to instructor from same user',
  usedIn: ['Update to Instructor Rate Limiting'],
}

//Init Route rate limit config
export const UPLOAD_INIT_IP_KEY = {
  namespace: 'limit-upload-init:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload session creation from one IP',
  usedIn: ['Upload Init Rate Limiting'],
} as const;

///Geneate Signature route rate limit config
export const UPLOAD_SIGN_IP_KEY = {
  namespace: 'limit-upload-sign:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload session creation from one IP',
  usedIn: ['Upload Init Rate Limiting'],
} as const;


//Generate Signature route rate limit config
export const UPLOAD_SIGN_USER_KEY = {
  namespace: 'limit-upload-sign:user',
  id: 'userId',
  max: 15,
  windowSec: 60,
  description: 'Limits Cloudinary signature requests per authenticated user',
  usedIn: ['Upload Signature User Rate Limiting'],
} as const;
export const UPLOAD_INIT_USER_KEY = {
  namespace: 'limit-upload-init:user',
  id: 'userId',
  max: 15,
  windowSec: 60,
  description: 'Limits Cloudinary signature requests per authenticated user',
  usedIn: ['Upload Init User Rate Limiting'],
} as const;

///Rate limit config for upload complete route
export const UPLOAD_COMPLETE_IP_KEY = {
  namespace: 'limit-upload-complete:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload session complete from one IP',
  usedIn: ['Upload Complete Rate Limiting'],
} as const;

export const UPLOAD_COMPLETE_USER_KEY = {
  namespace: 'limit-upload-complete:user',
  id: 'userId',
  max: 15,
  windowSec: 60,
  description: 'Limits Cloudinary signature requests per authenticated user',
  usedIn: ['Upload Complete User Rate Limiting'],
} as const;
//Upload ip for avatar, video, thumbnails
//This is anonymos upload, so chooose strict time 
export const AVATAR_SIGN_IP_KEY = {
  namespace: 'limit-upload-avatar:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload avatar from one IP',
  usedIn: ['Upload avatar Rate Limiting'],
} as const;
export const THUMBNAILS_SIGN_IP_KEY = {
  namespace: 'limit-upload-thumbnails:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload thumbnails from one IP',
  usedIn: ['Upload thumbnail Rate Limiting'],
} as const;
export const VIDEO_SIGN_IP_KEY = {
  namespace: 'limit-upload-video:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of upload video from one IP',
  usedIn: ['Upload Video Rate Limiting'],
} as const;

///Register route rate limit config
export const REGISTER_IP_KEY = {
  namespace: 'limit-register:ip',
  id: 'ip',
  max: 30,          // generous ceiling for legitimate service-to-service traffic
  windowSec: 60,
  description: 'Backstop against anonymous spam of new register request from one IP',
  usedIn: ['Register Rate Limiting'],
} as const;

export const USER_PROFILE_IP_KEY = {
  namespace: 'limit-user-profile:ip',
  id: 'ip',
  max: 120,
  windowSec: 60,
  description: 'Rate limits authenticated user profile reads by client IP',
  usedIn: ['User Profile API'],
} as const;

export const USER_PASSWORD_RESET_IP_KEY = {
  namespace: 'limit-user-password-reset:ip',
  id: 'ip',
  max: 10,
  windowSec: 15 * 60,
  description: 'Rate limits password reset email requests by client IP',
  usedIn: ['User Password Reset API'],
} as const;

export const USER_COURSE_DETAIL_IP_KEY = {
  namespace: 'limit-user-course-detail:ip',
  id: 'ip',
  max: 120,
  windowSec: 60,
  description: 'Rate limits user course detail reads by client IP',
  usedIn: ['User Course Detail API'],
} as const;

export const USER_COURSE_LIST_IP_KEY = {
  namespace: 'limit-user-course-list:ip',
  id: 'ip',
  max: 120,
  windowSec: 60,
  description: 'Rate limits user course list reads by client IP',
  usedIn: ['User Course List API'],
} as const;

export const USER_COURSE_BATCH_IP_KEY = {
  namespace: 'limit-user-course-batch:ip',
  id: 'ip',
  max: 60,
  windowSec: 60,
  description: 'Rate limits batched user course lookups by client IP',
  usedIn: ['User Course Batch API'],
} as const;

export const PROGRESS_LESSON_IP_KEY = {
  namespace: 'limit-progress-lesson:ip',
  id: 'ip',
  max: 30,
  windowSec: 60,
  description: 'Rate limits lesson progress generation and updates by client IP',
  usedIn: ['Lesson Progress API'],
} as const;

export const PROGRESS_COURSE_IP_KEY = {
  namespace: 'limit-progress-course:ip',
  id: 'ip',
  max: 60,
  windowSec: 60,
  description: 'Rate limits course progress reads by client IP',
  usedIn: ['Course Progress API'],
} as const;

export const PROGRESS_COMPLETE_IP_KEY = {
  namespace: 'limit-progress-complete:ip',
  id: 'ip',
  max: 20,
  windowSec: 60,
  description: 'Rate limits lesson completion and certificate job requests by client IP',
  usedIn: ['Lesson Completion API'],
} as const;

export const COURSE_LIKED_IP_KEY = {
  namespace: 'limit-course-liked:ip',
  id: 'ip',
  max: 60,
  windowSec: 60,
  description: 'Rate limits liked course list reads by client IP',
  usedIn: ['Liked Course API'],
} as const;

export const COURSE_LIKE_IP_KEY = {
  namespace: 'limit-course-like:ip',
  id: 'ip',
  max: 30,
  windowSec: 60,
  description: 'Rate limits course like and unlike operations by client IP',
  usedIn: ['Course Like API'],
} as const;

export const COURSE_LIKES_LIST_IP_KEY = {
  namespace: 'limit-course-likes-list:ip',
  id: 'ip',
  max: 60,
  windowSec: 60,
  description: 'Rate limits liked course search and list reads by client IP',
  usedIn: ['Course Likes List API'],
} as const;

export const CART_IP_KEY = {
  namespace: 'limit-cart:ip',
  id: 'ip',
  max: 60,
  windowSec: 60,
  description: 'Rate limits cart reads and course mutations by client IP',
  usedIn: ['Cart API'],
} as const;

export const ORDER_CREATE_CART_IP_KEY = {
  namespace: 'limit-order-create-cart:ip',
  id: 'ip',
  max: 10,
  windowSec: 60,
  description: 'Rate limits cart order creation by client IP',
  usedIn: ['Cart Order API'],
} as const;

export const ORDER_CREATE_COURSE_IP_KEY = {
  namespace: 'limit-order-create-course:ip',
  id: 'ip',
  max: 10,
  windowSec: 60,
  description: 'Rate limits course checkout order creation by client IP',
  usedIn: ['Course Order API'],
} as const;

export const ORDER_UPDATE_IP_KEY = {
  namespace: 'limit-order-update:ip',
  id: 'ip',
  max: 20,
  windowSec: 60,
  description: 'Rate limits order status update requests by client IP',
  usedIn: ['Order Update API'],
} as const;

export const CERTIFICATE_IP_KEY = {
  namespace: 'limit-certificate:ip',
  id: 'ip',
  max: 20,
  windowSec: 60,
  description: 'Rate limits certificate lookups by client IP',
  usedIn: ['Certificate API'],
} as const;

export const CART_COURSE_IP_KEY = {
  namespace: 'limit-cart-course:ip',
  id: 'ip',
  max: 30,
  windowSec: 60,
  description: 'Rate limits adding and removing courses from carts by client IP',
  usedIn: ['Cart Course API'],
} as const;

export const ADMIN_COUPON_IP_KEY = {
  namespace: 'limit-admin-coupon:ip',
  id: 'ip',
  max: 5,
  windowSec: 60,
  description: 'Rate limits administrative coupon reads and mutations by client IP',
  usedIn: ['Admin Coupon API'],
} as const;

export const ADMIN_COURSE_CREATE_USER_KEY = {
  namespace: 'limit-admin-course-create:user',
  id: 'userId',
  max: 10,
  windowSec: 60,
  description: 'Rate limits instructor course creation by client IP',
  usedIn: ['Admin Course Create API'],
} as const;
export const ADMIN_COURSE_CREATE_IP_KEY = {
  namespace: 'limit-admin-course-create:ip',
  id: 'ip',
  max: 10,
  windowSec: 60,
  description: 'Rate limits instructor course creation by client IP',
  usedIn: ['Admin Course Create API'],
} as const;

export const ADMIN_COURSE_DETAIL_IP_KEY = {
  namespace: 'limit-admin-course-detail:ip',
  id: 'ip',
  max: 20,
  windowSec: 60,
  description: 'Rate limits instructor course detail reads and mutations by client IP',
  usedIn: ['Admin Course Detail API'],
} as const;
export const ADMIN_COURSE_UPDATE_IP_KEY = {
  namespace: 'limit-admin-course-update:ip',
  id: 'ip',
  max: 20,
  windowSec: 60,
  description: 'Rate limits instructor course detail reads and mutations by client IP',
  usedIn: ['Admin Course Detail API'],
} as const;
export const ADMIN_COURSE_UPDATE_USER_KEY = {
  namespace: 'limit-user-admin-course-update:user',
  id: 'userId',
  max: 20,
  windowSec: 60,
  description: 'Rate limits instructor course detail reads and mutations by client IP',
  usedIn: ['Admin Course Detail API'],
} as const;

export const ADMIN_INSTRUCTOR_COURSES_IP_KEY = {
  namespace: 'limit-admin-instructor-courses:ip',
  id: 'ip',
  max: 60,
  windowSec: 60,
  description: 'Rate limits instructor course list and delete operations by client IP',
  usedIn: ['Admin Instructor Courses API'],
} as const;

export const COURSE_REVIEW_LIST_IP_KEY = {
  namespace: 'limit-course-review-list:ip',
  id: 'ip',
  max: 60,
  windowSec: 60,
  description: 'Rate limits course review listing by client IP',
  usedIn: ['Course Reviews API'],
} as const;

export const COURSE_REVIEW_MUTATION_IP_KEY = {
  namespace: 'limit-course-review-mutation:ip',
  id: 'ip',
  max: 15,
  windowSec: 60,
  description: 'Rate limits course review deletion by client IP',
  usedIn: ['Course Review Delete API'],
} as const;

export const COURSE_RATING_IP_KEY = {
  namespace: 'limit-course-rating:ip',
  id: 'ip',
  max: 15,
  windowSec: 60,
  description: 'Rate limits course review creation and updates by client IP',
  usedIn: ['Course Rating API'],
} as const;

export const CRON_RECONCILE_IP_KEY = {
  namespace: 'limit-cron-reconcile:ip',
  id: 'ip',
  max: 5,
  windowSec: 60,
  description: 'Rate limits payment reconciliation cron requests by client IP',
  usedIn: ['Payment Reconciliation Cron API'],
} as const;

// Generated key format: namespace:{ip} for IP limits and namespace:{userId} for user limits.
export const RATE_LIMIT_KEYS_QUICK_REFERENCE = `
REDIS RATE LIMIT KEYS - QUICK REFERENCE
=======================================
Key builder: buildKey(namespace, identifier) -> namespace:{identifier}
Limits are maximum requests per window. Windows are fixed-window durations.

IP-BASED LIMITS (key pattern | max requests | window | purpose)
limit-otp-send:ip:{ip}                         | 5   | 15m | Send email OTP
limit-otp-verify-email:ip:{ip}                 | 30  | 15m | Verify email OTP
limit-internal-auth:ip:{ip}                    | 300 | 60s | Internal/worker route authentication
limit-global:ip:{ip}                           | 100 | 60s | Global API protection
limit-update-to-instructor:ip:{ip}             | 30  | 60s | Update-to-instructor endpoint
limit-upload-init:ip:{ip}                      | 30  | 60s | Initialize upload
limit-upload-sign:ip:{ip}                      | 30  | 60s | Generate upload signature
limit-upload-complete:ip:{ip}                  | 30  | 60s | Complete upload
limit-upload-avatar:ip:{ip}                    | 30  | 60s | Avatar upload signature
limit-upload-thumbnails:ip:{ip}                | 30  | 60s | Thumbnail upload signature
limit-upload-video:ip:{ip}                     | 30  | 60s | Video upload signature
limit-register:ip:{ip}                         | 30  | 60s | Register
limit-user-profile:ip:{ip}                     | 120 | 60s | User profile reads
limit-user-password-reset:ip:{ip}              | 10  | 15m | Password reset email requests
limit-user-course-detail:ip:{ip}               | 120 | 60s | User course detail reads
limit-user-course-list:ip:{ip}                 | 120 | 60s | User course list reads
limit-user-course-batch:ip:{ip}                | 60  | 60s | Batched user course lookups
limit-progress-lesson:ip:{ip}                  | 30  | 60s | Lesson progress generation/updates
limit-progress-course:ip:{ip}                  | 60  | 60s | Course progress reads
limit-progress-complete:ip:{ip}                | 20  | 60s | Lesson completion/certificate requests
limit-course-liked:ip:{ip}                      | 60  | 60s | Liked course list reads
limit-course-like:ip:{ip}                       | 30  | 60s | Like/unlike operations
limit-course-likes-list:ip:{ip}                 | 60  | 60s | Liked course search/list reads
limit-cart:ip:{ip}                              | 60  | 60s | Cart reads and course mutations
limit-order-create-cart:ip:{ip}                 | 10  | 60s | Create cart order
limit-order-create-course:ip:{ip}               | 10  | 60s | Create course checkout order
limit-order-update:ip:{ip}                      | 20  | 60s | Update order status
limit-certificate:ip:{ip}                       | 20  | 60s | Certificate lookups
limit-cart-course:ip:{ip}                       | 30  | 60s | Add/remove cart courses
limit-admin-coupon:ip:{ip}                      | 5   | 60s | Admin coupon reads/mutations
limit-admin-course-create:ip:{ip}               | 10  | 60s | Admin course creation
limit-admin-course-detail:ip:{ip}               | 20  | 60s | Admin course detail reads/mutations
limit-admin-instructor-courses:ip:{ip}           | 60  | 60s | Admin instructor course list/delete
limit-course-review-list:ip:{ip}                 | 60  | 60s | Course review listing
limit-course-review-mutation:ip:{ip}             | 15  | 60s | Course review deletion
limit-course-rating:ip:{ip}                      | 15  | 60s | Course review creation/updates
limit-cron-reconcile:ip:{ip}                     | 5   | 60s | Payment reconciliation cron

USER-BASED LIMITS (key pattern | max requests | window | purpose)
limit-update-to-instructor:user:{userId}         | 30  | 60s | Update-to-instructor endpoint
limit-upload-sign:user:{userId}                  | 15  | 60s | Generate upload signature
limit-upload-init:user:{userId}                  | 15  | 60s | Initialize upload
limit-upload-complete:user:{userId}              | 15  | 60s | Complete upload

NOTES
* The identifier inside {braces} is the actual client IP or authenticated user id;
  the literal strings "ip" and "userId" in each constant's id field are labels.
* ADMIN_COURSE_CREATE_USER_KEY currently has the same namespace and IP identifier
  as ADMIN_COURSE_CREATE_IP_KEY. It is therefore an IP limit, not a user limit,
  and both constants use the same Redis counter.
`;