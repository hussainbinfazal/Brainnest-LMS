import { z } from "zod";

export const zodCourseSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    topic: z.string().min(3, "Topic must be at least 3 characters").max(50, "Topic must be at most 50 characters"),
    description: z.string().min(3, "Description must be at least 3 characters"),
    instructorId: z.string().min(3, "Instructor Id must be at least 3 characters"),
    price: z.number().min(1, "Price must be at least 1"),
    averageRating: z.number().min(0, "Average Rating must be at least 0").max(5, "Average Rating must be at most 5"),
    totalReviews: z.string().min(0, "Total Reviews must be at least 3 characters"),
    totalLessons: z.number().min(0, "Total Lessons must be at least 1"),
    coverImage: z.string().min(3, "Cover Image must be at least 3 characters"),
    tags: z.array(z.string().min(3, "Tag must be at least 3 characters")),
    discount: z.number().min(0, "Discount must be at least 0"),
    totalDurationInSeconds: z.number().min(0, "Total Duration must be at least 0"),
    language: z.string().min(3, "Language must be at least 3 characters"),
    status: z.string().min(3, "Status must be at least 3 characters"),
    level: z.string().min(3, "Level must be at least 3 characters"),
    totalEnrolledCount: z.number().min(0, "Total Enrolled Count must be at least 0"),
    lessons: z.array(z.object({
        name: z.string().min(3, "Lesson name must be at least 3 characters"),
        videoUrl: z.string().min(20, "Please provide a valid video URL"),
        description: z.string().min(3, "Lesson description must be at least 3 characters"),
        durationInSeconds: z.number().min(1, "Lesson duration must be at least 1"),
        isPreview: z.boolean(),
        isPreviewVideo: z.boolean(),
        order: z.number().min(1, "Lesson order must be at least 1"),
    })),
    sections: z.array(z.object({
        title: z.string().min(3, "Section title must be at least 3 characters"),
        description: z.string().min(3, "Section description must be at least 3 characters"),
        order: z.number().min(1, "Section order must be at least 1"),
    })),
    topics: z.array(z.object({
        name: z.string().min(3, "Topic name must be at least 3 characters"),
        slug: z.string().min(3, "Topic slug must be at least 3 characters"),
        description: z.string().min(3, "Topic description must be at least 3 characters"),
        isActive: z.boolean(),
    })),
    category: z.string().min(3, "Category name must be at least 3 characters"),
    subCategory: z.string().min(3, "Subcategory must be at least 3 characters"),
    requirements: z.array(z.string().min(3, "Requirements must be at least 3 characters")),
    whatYouWillLearn: z.array(z.string().min(3, "What You Will Learn must be at least 3 characters")),
    faq: z.array(
        z.object({
            question: z.string().min(3, "Question must be at least 3 characters"),
            answer: z.string().min(3, "Answer must be at least 3 characters"),
        })
    ),
    dripType: z.string().min(3, "Drip Type must be at least 3 characters"),
    previewVideo: z.string().min(3, "Preview Video must be at least 3 characters"),



});

export type CCreateCourse = z.infer<typeof zodCourseSchema>;