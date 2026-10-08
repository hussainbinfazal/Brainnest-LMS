import { z } from "zod";
 
// One lesson inside a section; the *PublicId fields point to files already uploaded to the pending folder
const lessonSchema = z.object({
    // Lesson title shown in the player sidebar
    name: z.string().trim().min(1).max(200),
    // Optional lesson description
    description: z.string().trim().max(2000).optional().default(""),
    // Cloudinary public_id of the main lecture video (required for every lesson)
    videoPublicId: z.string().min(1),
    // Cloudinary public_id of an optional preview clip
    previewPublicId: z.string().min(1).optional(),
    // Duration is coerced because forms often send numbers as strings
    durationInSeconds: z.coerce.number().int().min(0).default(0),
    // Whether non-enrolled users can watch this lesson
    isPreview: z.boolean().default(false),
    // Position of the lesson inside its section
    order: z.number().int().min(0),
});
 
// One section (chapter) of the course
const sectionSchema = z.object({
    // Section title
    title: z.string().trim().min(1).max(200),
    // Optional section description
    description: z.string().trim().max(2000).optional().default(""),
    // Position of the section inside the course
    order: z.number().int().min(0),
    // A section without lessons makes no sense, so require at least one
    lessons: z.array(lessonSchema).min(1),
});
 
// The full request body for POST /courses
export const createCourseSchema = z.object({
    // Course title
    title: z.string().trim().min(3).max(200),
    // Course description
    description: z.string().trim().min(1),
    // Price must never be negative
    price: z.coerce.number().min(0),
    // Discount is a percentage
    discount: z.coerce.number().min(0).max(100).default(0),
    // Parent category, only the name is needed (it is upserted)
    category: z.object({ name: z.string().trim().min(1) }),
    // Sub category name, upserted under the parent
    subCategory: z.string().trim().min(1),
    // FAQ entries (adjust the shape to match your IFaq)
    faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
    // Prerequisites list
    requirements: z.array(z.string().trim().min(1)).default([]),
    // Learning outcomes list
    whatYouWillLearn: z.array(z.string().trim().min(1)).default([]),
    // Only these two statuses are allowed; anything else is rejected instead of silently becoming draft
    status: z.enum(["draft", "published"]).default("draft"),
    // Course language
    language: z.string().trim().min(1),
    // Difficulty level (tighten to an enum if you have fixed values)
    level: z.string().trim().min(1),
    // Whether a certificate is issued
    certificate: z.boolean().default(false),
    // Free-form tags
    tags: z.array(z.string().trim().min(1)).default([]),
    // Topics are upserted by name
    topics: z.array(z.object({ name: z.string().trim().min(1), description: z.string().optional().default("") })).default([]),
    // Drip type (tighten to an enum if you have fixed values)
    dripType: z.string().trim().min(1),
    // Cloudinary public_id of the course cover image
    coverPublicId: z.string().min(1),
    // Cloudinary public_id of the course preview video
    previewVideoPublicId: z.string().min(1),
    // At least one section is required
    sections: z.array(sectionSchema).min(1),
});
 
// Inferred type, so the route never needs a hand-written interface
export type CreateCourseBody = z.infer<typeof createCourseSchema>;

// export const zodCourseSchema = z.object({
//     title: z.string().min(3, "Title must be at least 3 characters"),
//     topic: z.string().min(3, "Topic must be at least 3 characters").max(50, "Topic must be at most 50 characters"),
//     description: z.string().min(3, "Description must be at least 3 characters"),
//     instructorId: z.string().min(3, "Instructor Id must be at least 3 characters"),
//     price: z.number().min(1, "Price must be at least 1"),
//     averageRating: z.number().min(0, "Average Rating must be at least 0").max(5, "Average Rating must be at most 5"),
//     totalReviews: z.string().min(0, "Total Reviews must be at least 3 characters").optional(),
//     totalLessons: z.number().min(0, "Total Lessons must be at least 1"),
//     coverImage: z.string().min(3, "Cover Image must be at least 3 characters"),
//     coverPublicId: z.string().min(3, "Cover Public Id must be at least 3 characters"),
//     previewVideo: z.string().min(3, "Preview Video must be at least 3 characters"),
//     previewVideoPublicId: z.string().min(3, "Preview Video must be at least 3 characters"),
//     tags: z.array(z.string().min(3, "Tag must be at least 3 characters")),
//     discount: z.number().min(0, "Discount must be at least 0"),
//     totalDurationInSeconds: z.number().min(0, "Total Duration must be at least 0"),
//     language: z.string().min(3, "Language must be at least 3 characters"),
//     status: z.string().min(3, "Status must be at least 3 characters"),
//     level: z.string().min(3, "Level must be at least 3 characters"),
//     totalEnrolledCount: z.number().min(0, "Total Enrolled Count must be at least 0"),
//     sections: z.array(z.object({
//         title: z.string().min(3, "Section title must be at least 3 characters"),
//         description: z.string().min(3, "Section description must be at least 3 characters"),
//         order: z.number().min(1, "Section order must be at least 1"),
//         lessons: z.array(z.object({
//             name: z.string().min(3, "Lesson name must be at least 3 characters"),
//             videoUrl: z.string().min(20, "Please provide a valid video URL"),
//             videoPublicId: z.string().min(20, "Please provide a valid Upload Id"),
//             description: z.string().min(3, "Lesson description must be at least 3 characters"),
//             durationInSeconds: z.number().min(1, "Lesson duration must be at least 1"),
//             isPreview: z.boolean(),
//             previewUrl: z.string().optional(),
//             previewPublicId: z.string().optional(),
//             previewDurationInSeconds: z.number().optional(),
//             order: z.number().min(1, "Lesson order must be at least 1"),
//         }))
//     })),
//     topics: z.array(z.object({
//         name: z.string().min(3, "Topic name must be at least 3 characters"),
//         slug: z.string().min(3, "Topic slug must be at least 3 characters"),
//         description: z.string().min(3, "Topic description must be at least 3 characters"),
//         isActive: z.boolean(),
//     })),
//     category: z.string().min(3, "Category name must be at least 3 characters"),
//     subCategory: z.string().min(3, "Subcategory must be at least 3 characters"),
//     requirements: z.array(z.string().min(3, "Requirements must be at least 3 characters")),
//     whatYouWillLearn: z.array(z.string().min(3, "What You Will Learn must be at least 3 characters")),
//     faq: z.array(
//         z.object({
//             question: z.string().min(3, "Question must be at least 3 characters"),
//             answer: z.string().min(3, "Answer must be at least 3 characters"),
//         })
//     ),
//     dripType: z.string().min(3, "Drip Type must be at least 3 characters")
// });

export type CCreateCourse = z.infer<typeof createCourseSchema>; 