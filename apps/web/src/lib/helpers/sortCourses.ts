import { CCourse } from "@/types/client";

export function getCategoryCourses(categoryId: string, subCategories: string, courses: CCourse[]): CCourse[] {

  const categoryReleatedCourses: CCourse[] = courses.filter((course: CCourse) => {
  
    return course?.category?._id.toString() === categoryId;
  })
  return categoryReleatedCourses
}

export function getRandomCourses(courses: CCourse[]): CCourse[] {
  const randomCourses = courses.sort(() => Math.random() - 0.5);
  return randomCourses;
}