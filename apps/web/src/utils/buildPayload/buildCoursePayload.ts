import { CLesson } from "@/types/client"
import { CCreateCourseForm } from "@/types/forms/formValidators"

export const buildCoursePayload = (form: CCreateCourseForm) => {
    return {
        title: form.title.trim(),
        topic: form.topic.trim(),
        description: form.description.trim(),
        instructorId: form.instructorId,
        price: Number(form.price),
        averageRating: Number(form.averageRating),
        totalReviews: form.totalReviews,
        totalLessons: Number(form.totalLessons),
        coverImage: form.coverImage,
        tags: form.tags.map((tag: string) => tag.trim()),
        discount: Number(form.discount) || 0,
        totalDurationInSeconds: Number(form.totalDurationInSeconds),
        language: form.language,
        status: form.status,
        level: form.level,
        totalEnrolledCount: Number(form.totalEnrolledCount),
        sections: form.sections.map((section, sectionIndex) => ({
            _id: section._id ?? undefined,
            title: section.title.trim(),
            description: section.description.trim(),
            order: sectionIndex + 1,
            lessons: section.lessons.map((lesson: CLesson, lessonIndex: number) => ({
                _id: lesson._id ?? undefined,
                name: lesson.name.trim(),
                videoUrl: lesson.videoUrl.trim(),
                description: lesson.description.trim(),
                durationInSeconds: Number(lesson.durationInSeconds),
                isPreview: lesson.isPreview,
                previewUrl: lesson.previewUrl,
                previewDurationInSeconds: lesson.previewDurationInSeconds
                    ? Number(lesson.previewDurationInSeconds)
                    : undefined,
                order: lessonIndex + 1
            }))

        })),

        topics: form.topics.map((topic) => ({
            _id: topic._id ?? undefined,
            name: topic.name.trim(),
            slug: topic.slug.trim(),
            description: topic.description.trim(),
            isActive: topic.isActive
        })),
        category: form.category,
        subCategory: form.subCategory,
        requirements: form.requirements.map((requirement: string) => requirement.trim()),
        whatYouWillLearn: form.whatYouWillLearn.map((item: string) => item.trim()),
        faq: form.faq.map((item) => ({
            question: item.question.trim(),
            answer: item.answer.trim()
        })),
        dripType: form.dripType,
        previewVideo: form.previewVideo
    }
}




