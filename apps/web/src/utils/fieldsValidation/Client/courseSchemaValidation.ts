import { LEVELS } from "@/locales/locales";
import { z } from "zod";

const courseBase = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Course title must be at least 3 characters")
    .max(200),
  description: z
    .string()
    .trim()
    .min(3, "Course description must be at least 3 characters")
    .max(2000),
  price: z
    .number({ error: "Enter a valid price" })
    .min(0, "Price cannot be negative"),
  discount: z.number().min(0).max(100, "Discount cannot exceed 100%"),
  category: z.object({ name: z.string().trim().min(1, "Select a category") }),
  subCategory: z.string().trim().min(1, "Select a subcategory"),
  faq: z.array(
    z.object({
      question: z.string().trim().min(1, "Enter a question"),
      answer: z.string().trim().min(1, "Enter an answer"),
    })
  ),
  requirements: z.array(
    z.string().trim().min(1, "Requirement cannot be empty")
  ),
  whatYouWillLearn: z.array(
    z.string().trim().min(1, "Learning outcome cannot be empty")
  ),
  status: z.enum(["draft", "published"]),
  language: z.string().trim().min(1, "Select a language"),
  level: z.enum(LEVELS),
  certificate: z.boolean(),
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty"))
    .refine(
      (t) => t.every((x) => !Number.isFinite(Number(x))),
      "Tags cannot be only numbers"
    ),
  topics: z.array(
    z.object({
      name: z.string().trim().min(1, "Enter a topic name"),
      description: z.string().optional(),
      isActive: z.boolean(),
    })
  ),
  dripType: z.enum(["free", "sequential", "drip-by-date"]),
  coverImage: z.string().min(1, "Upload a course cover image"),
  coverPublicId: z.string().min(1, "Upload a course cover image"),
  previewVideo: z.string().min(3, "Upload a course preview video"),
  previewVideoPublicId: z.string().min(1, "Upload a course preview video"),
  totalLessons: z
    .number()
    .min(0, "Total Lessons must be at least 1")
    .default(0),
});
const lessonBase = z.object({
  name: z.string().trim().min(1, "Enter a lesson name").max(200),
  videoUrl: z.string().trim().min(1, "Upload a lesson video"),
  description: z.string().min(3).max(2000),
  videoPublicId: z.string().min(1, "Upload a lesson video"),
  previewPublicId: z.string().optional(),
  durationInSeconds: z.number().int().min(0),
  isPreview: z.boolean(),
  previewUrl: z.string().trim().optional(),
  previewDurationInSeconds: z.number().int().min(0),
  order: z.number().int().min(0),
});

const sectionBase = z.object({
  title: z.string().trim().min(3).max(2000),
  description: z.string().trim().min(1).max(2000),
  order: z.number().int().min(0),
});

const createLessonSchema = lessonBase.extend({
  durationInSeconds: lessonBase.shape.durationInSeconds.default(0),
  isPreview: lessonBase.shape.isPreview.default(false),
  previewDurationInSeconds:
    lessonBase.shape.previewDurationInSeconds.default(0),
});

const updateLessonSchema = lessonBase
  .partial()
  // unchanged lessons send only what changed
  .extend({ _id: z.string().optional() })
  .superRefine((lesson, ctx) => {
    if (lesson._id) return;
    const required = [
      "name",
      "description",
      "order",
      "durationInSeconds",
      "videoPublicId",
    ] as const;
    ///no id means brand new lesson
    for (const key of required) {
      if (lesson[key] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `New lesson need ${key}`,
        });
      }
    }
  });

const createSectionSchema = sectionBase.extend({
  lessons: z
    .array(createLessonSchema)
    .min(1, "Add at least one lesson to this section"),
  _id: z.string().optional(),
  courseId: z.string().optional(),
});
const updateSectionSchema = sectionBase.extend({
  _id: z.string().optional(),
  courseId: z.string().optional(),
  lessons: z
    .array(updateLessonSchema)
    .min(1, "Add at least one lesson to this section"),
});

export const createCourseSchema = courseBase.extend({
  discount: courseBase.shape.discount.default(0),
  faq: courseBase.shape.faq.default([]),
  requirements: courseBase.shape.requirements.default([]),
  whatYouWillLearn: courseBase.shape.whatYouWillLearn.default([]),
  status: courseBase.shape.status.default("draft"),
  level: courseBase.shape.level.default("beginner"),
  certificate: courseBase.shape.certificate.default(false),
  tags: courseBase.shape.tags.default([]),
  topics: courseBase.shape.topics.default([]),
  sections: z
    .array(createSectionSchema)
    .min(1, "Add at least one course section"),
  totalLessons: courseBase.shape.totalLessons.default(0),
});

const objectId = z.string().regex(/^[a-f/d]{24}$/i, "Invalid Id");
const updateLessonBase = lessonBase.extend({
  _id: objectId,
});
// The full request body for POST /courses
// export const createCourseSchema = z.object({
//     // Course title
//     title: z.string({ error: "Enter a course title" }).trim()
//         .min(3, "Course title must be at least 3 characters")
//         .max(200, "Course title must be 200 characters or fewer"),
//     // Course description
//     description: z.string({ error: "Enter a course description" }).trim()
//         .min(3, "Course description must be at least 3 characters")
//         .max(2000, "Course description must be 2000 characters or fewer"),
//     // Price must never be negative
//     price: z.coerce.number({ error: "Enter a valid price" })
//         .min(0, "Price cannot be negative"),
//     // Discount is a percentage
//     discount: z.number({ error: "Enter a valid discount percentage" })
//         .min(0, "Discount cannot be negative")
//         .max(100, "Discount cannot exceed 100%")
//         .default(0),
//     // Parent category, only the name is needed (it is upserted)
//     category: z.object({
//         name: z.string({ error: "Select a category" })
//             .trim()
//             .min(1, "Select a category"),
//     }, { error: "Select a category" }),
//     // Sub category name, upserted under the parent
//     subCategory: z.string({ error: "Select a subcategory" })
//         .trim()
//         .min(1, "Select a subcategory"),
//     // FAQ entries (adjust the shape to match your IFaq)
//     faq: z.array(z.object({
//         question: z.string({ error: "Enter a question" }).trim()
//             .min(1, "Enter a question"),
//         answer: z.string({ error: "Enter an answer" }).trim()
//             .min(1, "Enter an answer"),
//     })).default([]),
//     // Prerequisites list
//     requirements: z.array(z.string({ error: "Requirement cannot be empty" })
//         .trim()
//         .min(1, "Requirement cannot be empty"))
//         .default([]),
//     // Learning outcomes list
//     whatYouWillLearn: z.array(z.string({ error: "Learning outcome cannot be empty" })
//         .trim()
//         .min(1, "Learning outcome cannot be empty"))
//         .default([]),
//     // Only these two statuses are allowed; anything else is rejected instead of silently becoming draft
//     status: z.enum(["draft", "published"]).default("draft"),
//     // Course language
//     language: z.string({ error: "Select a language" })
//         .trim()
//         .min(1, "Select a language"),
//     // Difficulty level (tighten to an enum if you have fixed values)
//     level: z.string({ error: "Select a course level" })
//         .trim()
//         .min(1, "Select a course level")
//         .toLowerCase()
//         .default("beginner")
//         .pipe(z.enum(["beginner", "intermediate", "advanced"])),

//     // Whether a certificate is issued
//     certificate: z.boolean().default(false),
//     // Free-form tags
//     tags: z.array(z.string({ error: "Tag cannot be empty" })
//         .trim()
//         .min(1, "Tag cannot be empty"))
//         .refine(
//             (tags) => tags.every((tag) => !Number.isFinite(Number(tag))),
//             "Tags cannot contain values made only of numbers"
//         )
//         .default([]),
//     // Topics are upserted by name
//     topics: z.array(z.object({
//         name: z.string({ error: "Enter a topic name" }).trim()
//             .min(1, "Enter a topic name"),
//         description: z.string().optional().default(""),
//         isActive: z.boolean().default(false),
//     })).default([]),
//     // Drip type (tighten to an enum if you have fixed values)
//     dripType: z.enum(["free", "sequential", "drip-by-date"], {
//         error: "Select a lesson release schedule",
//     }),
//     coverImage: z.string({ error: "Upload a course cover image" })
//         .min(1, "Upload a course cover image"),
//     // Cloudinary public_id of the course cover image
//     coverPublicId: z.string({ error: "Upload a course cover image" })
//         .min(1, "Upload a course cover image"),
//     // Cloudinary public_id of the course preview video
//     previewVideoPublicId: z.string({ error: "Upload a course preview video" })
//         .min(1, "Upload a course preview video"),
//     // At least one section is required
//     sections: z.array(sectionSchema)
//         .min(1, "Add at least one course section"),
//     averageRating: z.number().min(0, "Average Rating must be at least 0").max(5, "Average Rating must be at most 5").default(0),
//     totalReviews: z.string().min(0, "Total Reviews must be at least 3 characters").optional(),
//     totalLessons: z.number().min(0, "Total Lessons must be at least 1").default(0),
//     previewVideo: z.string().min(3, "Preview Video must be at least 3 characters"),
//     totalEnrolledCount: z.string().min(0, "Total Enrolled Count must be at least 0").default("0"),
//     totalDurationInSeconds: z.number().min(0).optional(),
// });
export const updateCourseSchema = courseBase
  .pick({
    title: true,
    description: true,
    price: true,
    discount: true,
    category: true,
    subCategory: true,
    faq: true,
    requirements: true,
    whatYouWillLearn: true,
    status: true,
    language: true,
    level: true,
    certificate: true,
    tags: true,
    dripType: true,
  })
  .partial()
  .extend({
    // Topics are shared across courses, so only name + description matter here
    topics: z
      .array(
        z.object({
          _id: z.string().optional(),
          name: z.string().trim().min(1, "Enter a topic name"),
          description: z.string().optional(),
          isActive: z.boolean(),
        })
      )
      .optional(),
    // New cover upload (pending id) or the existing one echoed back
    coverPublicId: z.string().min(1).optional(),
    // New preview video upload (pending id) or the existing one echoed back
    previewVideoPublicId: z.string().min(1).optional(),
    // Send sections only when they changed; omitting leaves them untouched
    sections: z
      .array(updateSectionSchema)
      .min(1, "Add at least one course section"),
  })
  // Reject unknown keys so typos fail loudly instead of being dropped
  .strict()
  // Cross-field rule
  .superRefine((course, ctx) => {
    // Category and subcategory only make sense as a pair
    if (
      (course.category === undefined) !==
      (course.subCategory === undefined)
    ) {
      // Point the error at the missing half
      ctx.addIssue({
        code: "custom",
        path: [course.category === undefined ? "category" : "subCategory"],
        message: "Send category and subCategory together",
      });
    }
  });

export const updateCourseFormSchema = updateCourseSchema
  .safeExtend({
    coverImage: z.string().optional(),
    previewVideo: z.string().optional(),
  })
  .transform(({ coverImage, previewVideo, ...course }) => course);

// .extend({ sections: z.array(updateSectionSchema) })
// Inferred type, so the route never needs a hand-written interface
export type CreateCourseBody = z.infer<typeof createCourseSchema>;
// update body type, now a different shape
export type UpdateCourseBody = z.infer<typeof updateCourseSchema>;

const result = createCourseSchema.partial().safeParse({ title: "abc" });
console.log(result.success && result.data);
