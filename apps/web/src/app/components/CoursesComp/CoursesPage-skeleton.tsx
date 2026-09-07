import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";
import CourseCardSkeleton from "../skeletons/Course-Card-Skeleton";

export default function CoursesPageSkeleton(
    { className }: { className?: string }
): React.JSX.Element {
    return (<div className={cn("w-screen min-h-screen h-screen flex overflow-hidden",className)}>
        {/* Sidebar */}
        <aside className="w-62.5 min-h-screen border-r p-4">
            <div className="flex flex-col gap-6">
                {/* Sidebar toggle */}
                <Skeleton className="w-8 h-8 rounded-full" />

                {/* Categories */}
                <div className="flex flex-col gap-4">
                    <Skeleton className="w-28 h-6" />

                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-3">
                            <Skeleton className="w-24 h-5" />

                            <div className="flex flex-col gap-3 pl-1">
                                <Skeleton className="w-32 h-4" />
                                <Skeleton className="w-28 h-4" />
                                <Skeleton className="w-24 h-4" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Languages */}
                <div className="flex flex-col gap-3">
                    <Skeleton className="w-24 h-5" />

                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="w-28 h-4" />
                    ))}
                </div>

                {/* Levels */}
                <div className="flex flex-col gap-3">
                    <Skeleton className="w-20 h-5" />

                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="w-24 h-4" />
                    ))}
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen h-full flex flex-col gap-4 pt-4 px-4">
            {/* Header */}
            <div className="w-full flex justify-between items-center">
                <Skeleton className="w-28 h-9" />

                <Skeleton className="w-64 h-10" />
            </div>

            {/* Course Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <CourseCardSkeleton key={index} />
                ))}
            </div>

            {/* Pagination */}
            <div className="py-4 flex justify-center gap-2">
                <Skeleton className="w-20 h-9" />

                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="w-9 h-9" />
                ))}

                <Skeleton className="w-20 h-9" />
            </div>
        </main>
    </div>)
}