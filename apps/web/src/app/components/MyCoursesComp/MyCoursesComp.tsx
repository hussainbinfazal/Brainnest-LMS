"use client";

import React, { useState, useEffect, useRef, JSX } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import axios from "axios";
import { CCourse, CProgress } from "@/types/client";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/lib/store/usersStore/useAuthStore";
import { convertToTotalHours, formatRatingNumber } from "@/utils/timeFormat";
import { LessonProgress } from "@repo/shared/server";

type MyCoursesPageProps = {
    userEnrolledCourses: CCourse[],
    userProgresses: CProgress[]
}


export async function MyCoursesComp({ userEnrolledCourses, userProgresses }: MyCoursesPageProps) {
    const [courses, setCourses] = useState<CCourse[]>(userEnrolledCourses);
    const [authUserProgresses, setAuthUserProgresses] = useState<CProgress[]>(userProgresses)
    const { data: session, status } = useSession();
    const authUser = useAuthStore((state) => state.authUser);
    const [loading, setLoading] = useState<boolean>(true);
    return (
        <div className="min-h-screen w-full flex flex-col justify-start items-center gap-7 py-5">
            <div className="w-[70%] h-full flex flex-col items-start justify-start gap-4 py-5">
                <div className="text-4xl font-bold  flex justify-start items-center">
                    My Courses
                </div>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  justify-items-start gap-3">
                    {loading ? (
                        <>
                            <Skeleton className="w-75 h-100" />
                            <Skeleton className="w-75 h-100" />
                            <Skeleton className="w-75 h-100" />
                            <Skeleton className="w-75 h-100" />
                            <Skeleton className="w-75 h-100" />
                            <Skeleton className="w-75 h-100" />
                        </>
                    ) : (courses).length == 0 ? (
                        <div>
                            <h1 className="text-2xl font-bold">No Course Found</h1>
                        </div>
                    ) : (
                        (courses || []).map((course) => (
                            <Link
                                key={course._id}
                                href={`/courses/${course._id}`}
                                className="inline-block"
                            >
                                <Card
                                    key={course._id}
                                    className="w-62.5 h-87.5 my-2 relative pt-0 pb-3"
                                >
                                    <CardContent className="h-3/5 w-full flex justify-center relative p-0">
                                        {course?.coverImage ? (
                                            <>
                                                <div className="relative w-full h-full rounded-t-xl  overflow-hidden">
                                                    <Image
                                                        src={course.coverImage}
                                                        alt={course.title}
                                                        fill
                                                        className="object-cover p-0 z-6"
                                                    />
                                                </div>
                                                <div className="absolute -bottom-1 left-0 w-full z-0">
                                                    <Progress
                                                        value={Number(new LessonProgress(course))}
                                                        className="rounded-none"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <Skeleton className="w-full max-h-0.5" />
                                        )}
                                    </CardContent>
                                    <CardFooter className={"flex-1 z-7"}>
                                        <div className="w-full flex flex-col flex-1 items-start justify-center gap-2">
                                            <p className="capitalize text-lg font-semibold wrap-break-word leading-snug">
                                                {course.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {course?.instructorId?.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                ₹{course?.price ? parseInt(course.price.toString()) : 0}
                                            </p>
                                            <div className="flex gap-2">
                                                <Badge className="" variant="outline">
                                                    {course?.averageRating && formatRatingNumber(course.averageRating)}
                                                </Badge>
                                                <Badge className="flex gap-2" variant="outline">
                                                    {course?.totalDurationInSeconds &&
                                                        convertToTotalHours(course.totalDurationInSeconds)}{" "}
                                                    hours
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}