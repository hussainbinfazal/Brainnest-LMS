import { JSX } from "react/jsx-runtime";
import { LeesonIdPageComp } from "@/app/components/CourseIDComp/LessonIDComp/LessonIDComp";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { logger, validateMongooseId } from "@repo/shared/server";
import { getCourseByIdWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";
import { getLessonsByIdWithCache } from "@/lib/non-Admin-Cached/getCachedLessons";

// Render a YouTube video player
export async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<JSX.Element> {
  const { courseId, lessonId } = await params;
  const session: Session | null = await auth()
  if (!session?.user) {
    logger.warn("Unauthorized")
    return redirect('/')
  }
  if (!courseId || !lessonId || !validateMongooseId({ courseId, lessonId })) {
    logger.warn("Invalid course id")
    return redirect('/')
  }
  const [course, lessons] = await Promise.all([
    getCourseByIdWithCache(courseId),
    getLessonsByIdWithCache(courseId)
  ]);

  if (!course || !lessons) {
    logger.error("Course not found", { courseId })
    return redirect('/')
  }
  const lesson = lessons.find((l) => l._id === lessonId);
  if (!lesson) {
    logger.warn("Lesson not found", { courseId, lessonId });
    return redirect("/");
  }
  return <LeesonIdPageComp renderedCourse={course} renderedLessons={lessons} lesson={lesson} />;
};

export default LessonPage;
