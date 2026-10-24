import EditCourseComp from "@/app/components/AdminComp/AdminCourseComp/EditCourse/EditCourseComp";
import { auth } from "@/auth";
import { getInstructorCourseWithCache } from "@/lib/adminCached/getAdminCachedCourse";
import { logger, validateMongooseId } from "@repo/shared/server";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { JSX } from "react";

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
}
export default async function EditCoursePage({ params }: EditCoursePageProps): Promise<JSX.Element> {
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
  const { courseId } = await params;
  if (!courseId) {
    logger.error("Course id is required", { courseId })
    throw new Error()
  };
  let response;
  try {
    response = await getInstructorCourseWithCache(instructorId, courseId);
    if (!response.course) {
      console.error("This is the error in edit course page, while ssr", response);
      return redirect('/instructor/course/manage')
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong while fetching Instructor Courses";
    console.log("This is the error in edit course page, while ssr", error, 'This is the error message in Homepage', message);
    logger.error("Error in EditPage:", { error, message });
    return redirect('/instructor/course/manage')
  }
  return (
    <EditCourseComp
      renderedCourse={response.course}
      renderedCourseSections={response.sections}
      renderedCourseLessons={response.lessons}
      requestCourseId={courseId}
    />
  )
};
