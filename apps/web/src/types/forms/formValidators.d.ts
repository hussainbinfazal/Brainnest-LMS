import { CFaq, CLesson, CTopic } from "../client";

export interface CCreateCourseForm {
    title: string;
    topic: string;
    description: string;
    instructorId: string;
    price: number;
    averageRating: number;
    totalReviews?: string;
    totalLessons: number;
    coverImage: string;
    tags: string[];
    discount: number;
    totalDurationInSeconds: number;
    language: string;
    status: string;
    level: string;
    totalEnrolledCount: number;
    lessons: CLesson[];
    sections: CSection[];
    topics: CTopic[];
    category: string;
    subCategory: string;
    requirements: string[];
    whatYouWillLearn: string[];
    faq: CFaq[];
    dripType: string;
    previewVideo: string;
}
export interface CUpdateCourseForm {
    title: string;
    description: string;
    instructorId: string;
    durationInSeconds: number;
    price: number;
    discount: number;
    coverImage: string;
    category: string;
    subCategory: string;
    level: string;
    language: string;
    tags: string[]
    whatYouWillLearn: string[]
    requirements: string[];
    previewVideo: string;
    sections: CSection[]
    lessons: CLesson[]
    topics: CTopic[]
    faq: CFaq[]
    dripType: string
    status: string
}