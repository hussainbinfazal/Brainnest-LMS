"use client";
import axios from "axios";
import { useAuthStore } from "@/lib/store/usersStore/useAuthStore";
import Link from "next/link";
import { useState, useEffect, useCallback, ChangeEvent, JSX } from "react";
import React from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, useSpring, useScroll } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { IoSearch } from "react-icons/io5";
import { PiChatCircleDotsLight } from "react-icons/pi";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import LoadingBarLoader from "@/app/components/shared/LoadingBarLoader";
import { CCourse } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";
import { useInstructorCoursesStore } from "@/lib/store/instructorsStore/useInstructorCoursesStore";
import { set } from "mongoose";
const MotionButton = motion.create(Button);

interface ManageCoursePageProps {
    paginatedInstructorCourses: CCourse[];
}

const ManageCoursePageComponent = ({
    paginatedInstructorCourses,
}: ManageCoursePageProps): React.JSX.Element => {
    const router = useRouter();
    const [courses, setCourses] = useState<CCourse[]>(
        paginatedInstructorCourses || []
    );

    ///Store states
    const authUser = useAuthStore((state) => state.authUser);
    const setAuthUser = useAuthStore((state) => state.setAuthUser);
    const clearAuthUser = useAuthStore((state) => state.clearAuthUser);
    const fetchPaginatedInstructorCourses = useInstructorCoursesStore(
        (state) => state.fetchPaginatedInstructorCourses
    );
    const deleteInstructorCourse = useInstructorCoursesStore(
        (state) => state.deleteInstructorCourse
    );

    //Component States
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const itemsPerPage: number = 6; //This is limit;
    const [debouncedSearchTerm, setDebouncedSearchTerm] =
        useState<string>(searchTerm);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalInstructorCourses, setTotalInstructorCourses] =
        useState<number>(0);
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
    const maxVisiblePages = 4; // Number of visible page buttons
    // const params = new URLSearchParams({ //URL search params 
    //     page: page.toString(),
    //     limit: itemsPerPage.toString(),
    // });


    // Get paginated instructor courses from the store
    const getPaginatedInstructorCourses = useCallback(async () => {
        let instructorId = authUser?._id?.toString();
        if (
            !authUser ||
            authUser === null ||
            authUser.role !== "instructor" ||
            !instructorId
        ) {
            toast.error("You are not an unauthorized");
            return;
        }
        setIsLoading(true);
        try {
            await fetchPaginatedInstructorCourses({
                page: currentPage,
                itemsPerPage,
                instructorId,
            });
            setCourses(
                useInstructorCoursesStore.getState().cachedPaginatedInstructorCourses
            );
            setCurrentPage(
                useInstructorCoursesStore.getState().cachedCurrentPageNumber
            );
            setTotalPages(useInstructorCoursesStore.getState().cachedTotalPages);
            setTotalInstructorCourses(
                useInstructorCoursesStore.getState().cachedTotalCourses
            );
            setHasNextPage(useInstructorCoursesStore.getState().cachedHasNextPage);
            setHasPrevPage(useInstructorCoursesStore.getState().cachedHasPrevPage);
        } catch (error: unknown) {
            let message = "Something went wrong";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            clientLogger.error("Error while fetching manage course props", {
                message,
            });
            // toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    const updateUserToInstructor = useCallback(async (): Promise<void> => {
        try {
            const userId: string = authUser?._id ? authUser._id : "";

            const responseFromUpdateUser = await axios.put(
                `/api/users/update/updateToInstructor/${userId}`
            );

            const response = await axios.get("/api/users/me");
            // Update store with fresh user
            const { user } = response.data;
            setAuthUser(user);
            toast.success("Welcome to the teaching team at Brainnest.");
        } catch (error: unknown) {
            let message = "Something went wrong";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;
            } else if (error instanceof Error) {
                message = error.message;
            }
        }
    }, [authUser]);
    const handleDeleteCourse = async (courseId: string) => {
        let instructorId = authUser?._id?.toString();
        if (
            !authUser ||
            authUser === null ||
            authUser.role !== "instructor" ||
            !instructorId
        ) {
            toast.error("You are not an unauthorized");
            return;
        }
        try {
            setIsLoading(true);
            await deleteInstructorCourse({ page, itemsPerPage, courseId, instructorId });
            toast.success("Course deleted successfully");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Something went wrong";
            toast.error("Something went wrong");
            clientLogger.error("Error deleting course through instructor Store", { message, error });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
            updateUserToInstructor();
        }, 300); // Small delay to prevent immediate load
        return (): void => clearTimeout(timer);
    }, [updateUserToInstructor]);
    const filteredCourses =
        searchTerm?.trim() === ""
            ? courses
            : courses.filter((course: CCourse) => {
                const title = course.title?.toLowerCase() || "";
                const instructorName = course.instructorId?.name?.toLowerCase() || "";
                const term = searchTerm?.toLowerCase() || "";

                return title.includes(term) || instructorName.includes(term);
            });

    useEffect(() => {
        getPaginatedInstructorCourses();
    }, [getPaginatedInstructorCourses]);
    useEffect(() => {
        const timer: NodeJS.Timeout = setTimeout(
            (): void => setDebouncedSearchTerm(searchTerm),
            400
        );
        return (): void => clearTimeout(timer);
    }, [searchTerm]);
    if (isLoading) {
        return <CoursesPageSkeleton />;
    }
    return (
        <div className="min-h-screen w-full  flex flex-col  justify-start items-center  px-4 mt-0 mb-8 relative">
            {loading && (
                <div className="w-full relative">
                    <LoadingBarLoader isLoading={loading} />
                </div>
            )}
            <div className="w-[95%] lg:w-4/5 h-full flex flex-col items-start gap-4 justify-center pt-4">
                <div className="flex w-full flex-col lg:flex-row items-center lg:justify-center justify-start gap-3">
                    <span className="w-full text-3xl flex items-center justify-start my-4 mx-4  font-semibold">
                        Manage your courses here
                    </span>
                    <span className="flex gap-4 items-start sm:items-center justify-start lg:justify-end w-full lg:w-inline sm:flex-row flex-col">
                        <Link href={"/course/manage/chats"}>
                            <motion.span>
                                <MotionButton
                                    size="default"
                                    variant="default"
                                    className={
                                        "text-white dark:text-black rounded-full cursor-pointer"
                                    }
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.2 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                >
                                    <PiChatCircleDotsLight className="text-3xl" />
                                </MotionButton>
                            </motion.span>
                        </Link>
                        <Link href={"/course/manage/courseStats"}>
                            <motion.span>
                                <MotionButton
                                    size="default"
                                    variant="default"
                                    className={
                                        "text-white dark:text-black rounded-sm cursor-pointer"
                                    }
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.2 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                >
                                    Dashboard
                                </MotionButton>
                            </motion.span>
                        </Link>
                        <Link href={"/course/create"}>
                            <motion.span>
                                <MotionButton
                                    size="default"
                                    variant="default"
                                    className={
                                        "text-white dark:text-black rounded-sm cursor-pointer"
                                    }
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.2 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                >
                                    Create Course
                                </MotionButton>
                            </motion.span>
                        </Link>
                        <Link href={"/course/coupon"}>
                            <motion.span>
                                <MotionButton
                                    size="default"
                                    variant="default"
                                    className={
                                        "text-white dark:text-black rounded-sm cursor-pointer"
                                    }
                                    initial={{ scale: 1 }}
                                    whileHover={{ scale: 1.2 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                >
                                    Manage Coupon
                                </MotionButton>
                            </motion.span>
                        </Link>
                    </span>
                </div>
                <span className="w-full flex justify-end items-center">
                    <span className="relative ">
                        <Input
                            type="text"
                            placeholder="Search"
                            className="w-full"
                            value={searchTerm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setSearchTerm(e.target.value)
                            }
                        />
                        <IoSearch className="absolute top-2 right-2" />
                    </span>
                </span>
                <div className="flex flex-col w-full justify-center sm:justify-start">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full mt-4 justify-items-center">
                            {Array.from({ length: courses.length || 3 }).map((_, index) => (
                                <Card key={index} className="w-75 h-100 p-4 space-y-4 ">
                                    <Skeleton className="h-50 w-full" />
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-6 w-full" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-10 w-20" />
                                        <Skeleton className="h-10 w-20" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 justify-items-center gap-4 w-full mt-4">
                            {filteredCourses.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <p className="text-muted-foreground text-lg">
                                        {searchTerm?.trim() === ""
                                            ? "No course found yet."
                                            : `No course found for "${searchTerm}"`}
                                    </p>
                                </div>
                            ) : (
                                filteredCourses.map((course: CCourse) => {
                                    return (
                                        <div key={course._id} className="pl-4 ">
                                            <div>
                                                <Card
                                                    key={course._id}
                                                    className="w-100 sm:w-[320px] h-87.5 my-2 relative"
                                                >
                                                    <CardContent className="h-3/5 w-full flex justify-center relative">
                                                        {course?.coverImage ? (
                                                            <div className="relative w-full h-full p-4 rounded-xl overflow-hidden">
                                                                <Image
                                                                    src={course.coverImage}
                                                                    alt={course.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <Skeleton className="w-full h-50" />
                                                        )}
                                                    </CardContent>
                                                    <CardFooter className={"flex-1"}>
                                                        <div className="w-full flex flex-col flex-1 gap-2">
                                                            <p className="capitalize text-xl font-semibold wrap-break leading-snug">
                                                                {course.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {course?.instructorId?.name}
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <Badge className="" variant="outline">
                                                                    {course?.averageRating &&
                                                                        formatRatingNumber(course.averageRating)}
                                                                </Badge>
                                                                <Badge
                                                                    variant="default"
                                                                    className="outline flex gap-2"
                                                                >
                                                                    <>
                                                                        {course?.totalDurationInSeconds &&
                                                                            convertToTotalHours(
                                                                                course.totalDurationInSeconds
                                                                            )}
                                                                    </>{" "}
                                                                    hours
                                                                </Badge>
                                                            </div>
                                                            <div className="flex justify-between items-center w-full  mt-4">
                                                                <Button
                                                                    type="button"
                                                                    size="default"
                                                                    variant="destructive"
                                                                    className=" p-6 px-10 rounded-sm cursor-pointer"
                                                                    onClick={() => handleDeleteCourse(course._id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="default"
                                                                    variant="default"
                                                                    onClick={() =>
                                                                        router.push(`/course/edit/${course._id}`)
                                                                    }
                                                                    className="p-6 px-10 mr-2 rounded-sm cursor-pointer"
                                                                >
                                                                    Edit
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardFooter>
                                                </Card>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageCoursePageComponent;
