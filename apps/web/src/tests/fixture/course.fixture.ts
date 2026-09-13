import { CCategoryWithChildren } from "@/lib/getCachedCategory";
import { CCourse } from "@/types/client";

///shared fake course objects


// A single reusable fake course, shaped like the real CCourse type


export const mockCourse = {
    //Matches the courseId shaped like what API/props would actually provide
    _id: "course-1",
    title: "Full-Stack Web development",
    topic: [
        {
            _id: "topic-1",
            name: "Web development",
            slug: "web-development",
            description: "Web development fundamentals",
            isActive: true,
        },
    ],
    description: "Learn Full-Stack Web development from scratch.",
    coverImage: "https://example.com/course.jpg",
    instructorId: {
        _id: "instructor-1",
        name: "Test Instructor",
        profileImage: "https://example.com/instructor.jpg",
    },
    averageRating: 4.5,
    price: 19.99,
    discount: 0,
    level: "beginner",
    totalEnrolledCount: 42,
    language: "English",
    status: "published",
    topics: [],
    totalReviews: 42,
    ratingDistribution: [],
    totalLessons: 0,
    category: {
        _id: "category-1",
        name: "development",
        slug: "development",
        parent: null,
    },
    certificate: true,
    dripType: "free",
    totalDurationInSeconds: 0,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
} satisfies CCourse;


///A factory function for when a test needs slight variations (e.g different price, different Id)
export const buildMockCourse = (overrides = {}) => ({
    ...mockCourse,
    ...overrides,
});




//A factory function for when a test needs catgories 

export const buildMockCategory = (overrides = {}): CCategoryWithChildren => ({
    _id: "cat-1",
    name: "Development",
    slug: "development",
    parent: null,
    children: [
        {
            _id: "cat-2",
            name: "Frontend",
            slug: "frontend",
            parent: { _id: "cat-1", name: "Development" },
        },
        {
            _id: "cat-3",
            name: "Backend",
            slug: "backend",
            parent: { _id: "cat-1", name: "Development" },
        },
    ],
    ...overrides,
})