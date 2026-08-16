import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "radix-ui";
import CourseCardSkeleton from "../skeletons/Course-Card-Skeleton";

export default function CourseIdPageSkeleton(): React.JSX.Element {
    return <main className={cn("w-full bg-brand-white dark:bg-black")}> <div className="relative w-full min-h-screen flex flex-col gap-6 py-18 pt-0">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-1/2 dark:bg-black bg-white -z-10" />

      {/* =========================================================
          COURSE COVER
      ========================================================= */}
      <section className="w-full flex items-center justify-center">
        <Skeleton className="w-[90%] md:w-[70%] lg:w-[60%] h-75 rounded-lg" />
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="relative w-[90%] md:w-[90%] lg:w-[60%] mx-auto flex flex-col gap-6 min-h-screen pt-2">

        {/* =======================================================
            ACTION BUTTONS
        ======================================================= */}
        <div className="absolute right-0 top-2 flex items-center gap-2">
          {/* <Skeleton className="w-5 h-10 rounded-full" /> */}
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-24 h-10 rounded-md" />
        </div>

        {/* =======================================================
            COURSE TITLE / TOPIC / PRICE
        ======================================================= */}
        <section className="w-full flex flex-col items-start gap-4 pt-12 md:pt-0">
          {/* Title */}
          <Skeleton className="w-[85%] h-10 md:h-12 rounded-md" />

          {/* Topic */}
          <Skeleton className="w-32 h-5 rounded-md" />

          {/* Topic description */}
          <Skeleton className="w-[70%] h-4 rounded-md" />

          {/* Bestseller */}
          <Skeleton className="w-24 h-7 rounded-md" />

          {/* Price */}
          <Skeleton className="w-28 h-8 rounded-md" />
        </section>

        {/* =======================================================
            COURSE META
        ======================================================= */}
        <section className="w-full flex flex-wrap gap-5 items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-28 h-4 rounded-md" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>
        </section>

        {/* =======================================================
            COURSE TRUST / STATS CARD
        ======================================================= */}
        <section className="w-full h-30 border-2 border-gray-300 rounded-lg flex items-center">

          {/* Verified */}
          <div className="w-1/5 h-full flex items-center justify-center">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>

          {/* Brainnest text */}
          <div className="w-2/5 h-full flex flex-col justify-center gap-3 px-3">
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-[85%] h-4 rounded-md" />
            <Skeleton className="w-[65%] h-4 rounded-md" />
          </div>

          <div className="h-3/5 w-px bg-gray-300 hidden sm:block" />

          {/* Rating */}
          <div className="w-1/5 h-full flex flex-col items-center justify-center gap-3">
            <Skeleton className="w-24 h-5 rounded-md" />
            <Skeleton className="w-16 h-4 rounded-md" />
          </div>

          <div className="h-3/5 w-px bg-gray-300" />

          {/* Learners */}
          <div className="w-1/5 h-full flex flex-col items-center justify-center gap-3">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>
        </section>

        {/* =======================================================
            WHAT YOU'LL LEARN
        ======================================================= */}
        <section className="w-full border-2 border-gray-300 p-4 mt-2">
          <Skeleton className="w-48 h-7 rounded-md" />

          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                <Skeleton
                  className={`h-4 rounded-md ${
                    index % 2 === 0 ? "w-[85%]" : "w-[70%]"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* =======================================================
            RELATED TOPICS
        ======================================================= */}
        <section className="w-full flex flex-col gap-4 mt-2">
          <Skeleton className="w-64 h-7 rounded-md" />

          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                className="w-28 h-10 rounded-md"
              />
            ))}
          </div>
        </section>

        {/* =======================================================
            COURSE INCLUDES
        ======================================================= */}
        <section className="w-full flex flex-col gap-4 mt-2">
          <Skeleton className="w-56 h-7 rounded-md" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <Skeleton className="w-7 h-7 rounded-md" />
                <Skeleton className="w-48 h-4 rounded-md" />
              </div>
            ))}
          </div>
        </section>

        {/* =======================================================
            COURSE CONTENT
        ======================================================= */}
        <section className="w-full flex flex-col gap-4 mt-2">
          <Skeleton className="w-48 h-7 rounded-md" />

          <div className="w-full flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="w-full min-h-17.5 border-2 border-gray-300 rounded-md flex items-center justify-between px-4"
              >
                {/* Lesson title */}
                <div className="flex items-center gap-4 w-1/2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton
                    className={`h-4 rounded-md ${
                      index % 2 === 0 ? "w-40" : "w-56"
                    }`}
                  />
                </div>

                {/* Duration */}
                <div className="flex items-center gap-3">
                  <Skeleton className="w-20 h-4 rounded-md" />
                  <Skeleton className="w-16 h-4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =======================================================
            REQUIREMENTS
        ======================================================= */}
        <section className="w-full flex flex-col gap-4 mt-2 px-2">
          <Skeleton className="w-40 h-7 rounded-md" />

          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton
                  className={`h-5 rounded-md ${
                    index % 2 === 0 ? "w-[80%]" : "w-[60%]"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* =======================================================
            DESCRIPTION
        ======================================================= */}
        <section className="w-full flex flex-col gap-4 mt-2 px-2">
          <Skeleton className="w-40 h-7 rounded-md" />

          <div className="flex flex-col gap-3">
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-[90%] h-4 rounded-md" />
            <Skeleton className="w-[75%] h-4 rounded-md" />
          </div>

          <Skeleton className="w-28 h-9 rounded-md" />
        </section>

        {/* =======================================================
            COURSE REVIEWS
        ======================================================= */}
        <section className="w-full flex flex-col gap-5 mt-4 px-2">
          {/* Heading */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-32 h-6 rounded-md" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>

          {/* Review cards */}
          <div className="w-full flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="min-w-62.5 h-70 border rounded-md p-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <Skeleton className="w-6 h-6 rounded-md" />

                  <Skeleton className="w-full h-4 rounded-md" />
                  <Skeleton className="w-[90%] h-4 rounded-md" />
                  <Skeleton className="w-[75%] h-4 rounded-md" />
                </div>

                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />

                  <div className="flex flex-col gap-2">
                    <Skeleton className="w-24 h-4 rounded-md" />
                    <Skeleton className="w-20 h-3 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =======================================================
            INSTRUCTOR
        ======================================================= */}
        <section className="w-full flex flex-col gap-5 mt-4 px-2">
          <Skeleton className="w-32 h-7 rounded-md" />

          <div className="w-full flex items-center gap-5">
            {/* Avatar */}
            <Skeleton className="w-15 h-15 rounded-full shrink-0" />

            {/* Instructor name */}
            <Skeleton className="w-40 h-6 rounded-md" />

            {/* Courses */}
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-md" />
              <Skeleton className="w-10 h-5 rounded-md" />
            </div>

            {/* Reviews */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-md" />
              <Skeleton className="w-10 h-5 rounded-md" />
            </div>

            {/* Students / badges */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-md" />
              <Skeleton className="w-10 h-5 rounded-md" />
            </div>
          </div>
        </section>

        {/* =======================================================
            OTHER COURSES BY INSTRUCTOR
        ======================================================= */}
        <section className="w-full flex flex-col gap-5 mt-4 px-2">
          <Skeleton className="w-80 h-8 rounded-md" />

          <div className="w-full flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
            //   <div
            //     key={index}
            //     className="min-w-62.5 h-75 border rounded-xl overflow-hidden"
            //   >
            //     {/* Course image */}
            //     <Skeleton className="w-full h-44 rounded-none" />

            //     {/* Course information */}
            //     <div className="p-4 flex flex-col gap-3 py-5">
            //       <Skeleton className="w-full h-5 rounded-md" />
            //       <Skeleton className="w-[80%] h-4 rounded-md" />
            //       <Skeleton className="w-20 h-5 rounded-md" />

            //       <div className="flex gap-2">
            //         <Skeleton className="w-16 h-6 rounded-md" />
            //         <Skeleton className="w-20 h-6 rounded-md" />
            //         <Skeleton className="w-20 h-6 rounded-md" />
            //       </div>
            //     </div>
            //   </div>
            <CourseCardSkeleton key={index} cardClassName={"w-full"} />
            ))}
          </div>
        </section>

        {/* =======================================================
            ADD REVIEW
        ======================================================= */}
        <section className="w-full flex flex-col gap-5 mt-8 px-2">
          <Skeleton className="w-44 h-8 rounded-md" />

          {/* Textarea */}
          <Skeleton className="w-full h-32 rounded-md" />

          {/* Rating */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="w-7 h-7 rounded-md"
                />
              ))}
            </div>

            <Skeleton className="w-32 h-11 rounded-md" />
          </div>
        </section>

        {/* =======================================================
            ACHIEVER / TESTIMONIAL SECTION
        ======================================================= */}
        <section className="w-full flex flex-col gap-5 mt-8">
          <Skeleton className="w-[75%] h-9 rounded-md" />
          <Skeleton className="w-[55%] h-5 rounded-md" />

          <div className="w-full flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-w-62.5 h-70 border rounded-xl p-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <Skeleton className="w-6 h-6 rounded-md" />
                  <Skeleton className="w-full h-4 rounded-md" />
                  <Skeleton className="w-[90%] h-4 rounded-md" />
                  <Skeleton className="w-[70%] h-4 rounded-md" />
                </div>

                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />

                  <div className="flex flex-col gap-2">
                    <Skeleton className="w-24 h-4 rounded-md" />
                    <Skeleton className="w-20 h-3 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
    </main>;

}