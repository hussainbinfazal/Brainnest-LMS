import { CCreateCourseForm } from "@/types/forms/formValidators"

export const buildCoursePayload = (form: CCreateCourseForm) => {
    return {
        title: form.title.trim(),
        price: Number(form.price),
        coverImage: form.coverImage,
        category: form.category,
        subCategory: form.subCategory,
        description: form.description.trim(),
        discount: Number(form.discount) || 0,
        instructorId: form.instructorId,
        level: form.level,
        language: form.language,
        durationInSeconds: Number(form.durationInSeconds),
        tags: form.tags.map((tag: string) => tag.trim()),
        requirements: form.requirements.map((requirement: string) => requirement.trim()),
        whatYouWillLearn: form.whatYouWillLearn.map((item) => item.trim()),
        sections: form.sections.map((section) => ({
            ...section,
            _id: section._id ?? undefined,
            title: section.title.trim(),
            description: section.description.trim(),

        })),
        faq: form.faq.map((item) => ({
            question: item.question.trim(),
            answer: item.answer.trim()
        })),
        status: form.status,
        dripType: form.dripType,
        previewVideo: form.previewVideo,
        isPreview: false,
        lessons: form.lessons.map((lesson) => ({
            _id: lesson._id ?? undefined,
            isPreviewVideo: lesson.isPreviewVideo,
            isPreview: lesson.isPreview,
            durationInSeconds: Number(lesson.durationInSeconds),
            description: lesson.description.trim(),
            videoUrl: lesson.videoUrl.trim(),
            name: lesson.name.trim(),
            order: Number(lesson.order)
        })),
        topics: form.topics.map((topic) => ({
            _id: topic._id ?? undefined,
            name: topic.name.trim(),
            description: topic.description.trim(),
            slug: topic.slug.trim(),
            isActive: true
        })),




    }




}