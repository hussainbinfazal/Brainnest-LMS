import { CCourse } from "@/types/client";

export function getCategoryCourses(categoryId: string, subCategories: string, courses: CCourse[]): CCourse[] {

  const categoryReleatedCourses: CCourse[] = courses.filter((course: CCourse) => {
    // console.log("Looking for categoryId:", categoryId);
    // console.log("Courses' actual category._id values:", courses.map(c => c?.category?._id));
    // console.log("Courses' category.parent._id values:", courses.map(c => c?.category?.parent?._id));
    // console.log("This is the course", course);
    // console.log("This is the course.category._id in categoryReleated Courrses", course?.category?._id);
    // console.log("This is the category._id in categoryReleated Courrses", categoryId);


    return course?.category?._id.toString() === categoryId;

  })
  // console.log(
  //   `getCategoryCourses(${categoryId}) matched ${categoryReleatedCourses.length} of ${courses.length} courses`
  // );

  return categoryReleatedCourses
}

export function getRandomCourses(courses: CCourse[]): CCourse[] {
  const randomCourses = courses.sort(() => Math.random() - 0.5);
  return randomCourses;
}