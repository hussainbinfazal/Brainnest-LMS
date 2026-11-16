import { JSX } from "react/jsx-runtime";
import MyProfilePageComp from "../components/MyProfileComp/MyProfileComp";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { getAllUserCourseByIdWithCache } from "@/lib/non-Admin-Cached/getCachedUserCourse";
import { getCourseByIdWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";
import { CCourse } from "@/types/client";

async function MyProfilePage(): Promise<JSX.Element> {
  const session: Session | null = await auth();
  if (!session) throw new Error("Unauthorized")
  if (!session?.user) throw new Error("Unauthorized")
  let completedCourseIds: string[] = [];
  let pendingCourseIds: string[] = [];
  const userId: string = session.user.id
  const allUserCourses = await getAllUserCourseByIdWithCache(userId);
  completedCourseIds = allUserCourses.map((course) => course.isCompleted ? course.courseId : "")
  pendingCourseIds = allUserCourses.map((course) =>
    !course.isCompleted ? "" : (course.courseId).toString()
  )
  const enrolledUserCourses = allUserCourses.filter((course) => course.isEnrolled);
  const coursesUserEnrolled = (
    await Promise.all(
      enrolledUserCourses.map((course) =>
        getCourseByIdWithCache(course.courseId)
      )
    )
  ).filter((course): course is CCourse => course !== null);

  return <MyProfilePageComp completedCourseIds={completedCourseIds} pendingCourseIds={pendingCourseIds} enrolledUserCourses={enrolledUserCourses} coursesUserEnrolled={coursesUserEnrolled} />;
};

export default MyProfilePage;
