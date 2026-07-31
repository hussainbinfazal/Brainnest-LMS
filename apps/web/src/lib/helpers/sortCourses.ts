import { CCourse } from "@/types/client";

 export function getCategoryCourses(categoryId: string, subCategories: string, courses: CCourse[]): CCourse[] {
    
  const categoryReleatedCourses = courses.filter((course: CCourse) =>
      course?.category._id === categoryId
    );
    console.log("This is the category related courses", categoryReleatedCourses);
    return categoryReleatedCourses;
  }

  export function getRandomCourses(courses: CCourse[]): CCourse[] {
    const randomCourses = courses.sort(() => Math.random() - 0.5);
    return randomCourses;
  }