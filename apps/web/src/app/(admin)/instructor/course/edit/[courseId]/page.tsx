import EditCourseComp from "@/app/components/AdminComp/AdminCourseComp/EditCourse/EditCourseComp";
import { Course, Lesson, logger, Section } from "@repo/shared/server";
import { JSX } from "react";

type EditCoursePageProps = {
  context: { params: Promise<{ courseId: string | string[] }> };

}
export async function EditCoursePage({ context }: EditCoursePageProps): Promise<JSX.Element> {
  const params = await context.params
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId
  if (!courseId) {
    logger.error("Course id is required", { courseId })
    throw new Error()
  };
  ///Find the course, instructor or admin want to update/Edit
  const [courseFromDb, sectionsFromDb, LessonsFromDb] = await Promise.all([Course.findById(courseId).lean().exec(), Section.find({ courseId: courseId }).lean().exec(), Lesson.find({ courseId }).lean().exec()])

  if (!courseFromDb) {
    logger.error("Course not found this course", { courseId })
    throw new Error()
  };
  if (!sectionsFromDb) {
    logger.error("Sections not found this course", { courseId })
    throw new Error()
  };
  if (!LessonsFromDb) {
    logger.error("Lessons not found for this course", { courseId })
    throw new Error()
  };

  return <EditCourseComp renderedCourse={courseFromDb} renderedCourseSections={sectionsFromDb} renderedCourseLessons={LessonsFromDb} requestCourseId={courseId} />;

};

export default EditCoursePage;
