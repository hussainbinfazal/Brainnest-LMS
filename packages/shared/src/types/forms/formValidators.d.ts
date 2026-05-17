import { CFaq, CLesson, CTopic } from "../client";

export interface CCreateCourseForm {
    title: string;
    description: string;
    instructorId: string;
    durationInSeconds:number;
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
    topics:CTopic[]
    faq: CFaq[]
    dripType: string
    status: string
}
export interface CUpdateCourseForm {
    title: string;
    description: string;
    instructorId: string;
    durationInSeconds:number;
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
    topics:CTopic[]
    faq: CFaq[]
    dripType: string
    status: string
}