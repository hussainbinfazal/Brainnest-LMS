import { JSX } from "react";
import { MyCoursesComp } from "../components/MyCoursesComp/MyCoursesComp";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Session } from "next-auth";
import { getUserCourseWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";
import { CCourse } from "@/types/client";
import { getUserProgressByUserIdWithCache } from "@/lib/non-Admin-Cached/getCachedUserProgress";


export async function MyCoursesPage(): Promise<JSX.Element> {
  const session: Session | null = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const userId: string = session.user.id

  const courses = await getUserCourseWithCache(userId) ?? []
  const progressesResult = await getUserProgressByUserIdWithCache(userId)
  const progresses = progressesResult?.allCurrentProgress ?? []
  const lessonProgress = []
  return <MyCoursesComp userEnrolledCourses={courses} userProgresses={progresses} />
};

export default MyCoursesPage;




/////User lesson progress for progress bar in my courses page and also sync the page with update routes
