import EditCourseComp from "@/app/components/AdminComp/AdminCourseComp/EditCourse/EditCourseComp";
import { auth } from "@/auth";
import { Course, getCached, Lesson, logger, Section, validateMongooseId } from "@repo/shared/server";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { JSX } from "react";
import { SessionContextImpl } from "twilio/lib/rest/proxy/v1/service/session";

type EditCoursePageProps = {
  context: { params: Promise<{ courseId: string | string[] }> };

}
export async function EditCoursePage({ context }: EditCoursePageProps): Promise<JSX.Element> {
  const session: Session | null = await auth()
  if (!session) {

    logger.warn("Unauthorized access attempt", { session })
    return redirect('/login')
  }
  const instructorId: string = session.user.id;

  if (!validateMongooseId({ userId: instructorId })) {
    logger.error("You are not authroized to access this", { userId: instructorId });
    return redirect('/login')
  }
  const params = await context.params
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId
  if (!courseId) {
    logger.error("Course id is required", { courseId })
    throw new Error()
  };
  const cachedCourseInfo = await getCached()
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
