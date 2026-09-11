"use client";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import axios from "axios";
import { motion } from "framer-motion";
import { FcLike } from "react-icons/fc";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { RiDeleteBin6Line } from "react-icons/ri";
import { JSX } from "react/jsx-runtime";
import { CCourse, CCart } from "@/types/client";
import { useUserCourseStore } from "@/lib/store/useUserCourseStore";
import { clientLogger } from "@/utils/logger/clientLogger";
import LikeCoursesPageSkeleton from "./LikedCoursesPage-skeleton";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getVisiblePages } from "@/lib/helpers/pagesCalculationHelper";


type CLikedCoursesPageCompProps = { userLikedCourses: CCourse[], className?: string };
const LikedCoursesPageComp = ({ userLikedCourses, className }: CLikedCoursesPageCompProps): JSX.Element => {
  const [likedCourses, setLikedCourses] = useState<CCourse[] | []>(userLikedCourses || []);
  const setLiked = useUserCourseStore((state) => state.updateUserCourse);
  const likedCourseIds = useUserCourseStore((state) => state.likedCourseIds);
  const setUpdatingLike = useUserCourseStore((state) => state.setUpdatingLike);
  const setUserCourseById = useUserCourseStore((state) => state.setUserCourseById);
  const fetchUserLikedCourses = useUserCourseStore((state) => state.fetchUserLikedCourses);
  const user = useAuthStore((state) => state.authUser);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState({
    _id: "6641320fd8342c7f98765432",
    user: "663fe7f4c24e1b001f8a1234",
    likedCourses: [
      {
        _id: "663faaaa34eeae0123456789",
        title: "Full-Stack Web Development",
        description: "Learn MERN stack from scratch.",
        price: 100,
        discount: 10,
        instructor: "Instructor Name",
        createdAt: "2024-04-01T12:00:00.000Z",
        updatedAt: "2024-04-10T12:00:00.000Z",
        __v: 0,
      },
      {
        _id: "663fabcd78dfae0123456790",
        title: "React Advanced Course",
        description: "Advanced patterns and performance optimization in React.",
        price: 80,
        discount: 0,
        instructor: "Another Instructor",
        createdAt: "2024-03-15T15:00:00.000Z",
        updatedAt: "2024-03-20T15:00:00.000Z",
        __v: 0,
      },
      ///Format
      {
        _id: "663fabcd78dfae0123456790",
        title: "React Advanced Course",
        description: "Advanced patterns and performance optimization in React.",
        price: 80,
        discount: 0,
        instructor: "Another Instructor",
        createdAt: "2024-03-15T15:00:00.000Z",
        updatedAt: "2024-03-20T15:00:00.000Z",
        __v: 0,
      },
      {
        _id: "663fabcd78dfae0123456790",
        title: "React Advanced Course",
        description: "Advanced patterns and performance optimization in React.",
        price: 80,
        discount: 0,
        instructor: "Another Instructor",
        createdAt: "2024-03-15T15:00:00.000Z",
        updatedAt: "2024-03-20T15:00:00.000Z",
        __v: 0,
      },
      {
        _id: "663fabcd78dfae0123456790",
        title: "React Advanced Course",
        description: "Advanced patterns and performance optimization in React.",
        price: 80,
        discount: 0,
        instructor: "Another Instructor",
        createdAt: "2024-03-15T15:00:00.000Z",
        updatedAt: "2024-03-20T15:00:00.000Z",
        __v: 0,
      },
      {
        _id: "663fabcd78dfae0123456790",
        title: "React Advanced Course",
        description: "Advanced patterns and performance optimization in React.",
        price: 80,
        discount: 0,
        instructor: "Another Instructor",
        createdAt: "2024-03-15T15:00:00.000Z",
        updatedAt: "2024-03-20T15:00:00.000Z",
        __v: 0,
      },
      {
        _id: "663fabcd78dfae0123456790",
        title: "React Advanced Course",
        description: "Advanced patterns and performance optimization in React.",
        price: 80,
        discount: 0,
        instructor: "Another Instructor",
        createdAt: "2024-03-15T15:00:00.000Z",
        updatedAt: "2024-03-20T15:00:00.000Z",
        __v: 0,
      },
    ],
    subtotal: 180,
    tax: 18,
    discount: 10,
    total: 188,
    createdAt: "2024-05-09T12:00:00.000Z",
    updatedAt: "2024-05-09T12:00:00.000Z",
    __v: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const itemsPerPage: number = 6; //This is limit;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
  const maxVisiblePages = 4; // Number of visible page buttons
  const router = useRouter();
  const toggleLikeCourse = async (courseId: string): Promise<void> => {
    if (!user) {
      return alert("Please login first");
    }
    if (!courseId) {
      return alert("Something went wrong");
    }

    // console.log("1. LIKE COURSE FUNCTION CALLED")
    const store = useUserCourseStore.getState();
    const currentUserCourse = store.userCourseByCourseId[courseId];
    const isUpdating = store.isUpdatingLikeByCourseId[courseId]
    // console.log("2. LIKE COURSE FUNCTION CALLED")

    //Avoid duplicate request
    if (isUpdating) {
      toast.error("You have already liked this course");
      return
    }
    // console.log("3. LIKE COURSE FUNCTION CALLED")
    // Store previous state for rollback
    const previousUserCourse = currentUserCourse;
    const shouldDislike = currentUserCourse?.isLiked;
    setUpdatingLike(courseId, true);
    setLiked(courseId, {
      isLiked: false,
      likedAt: null,
    });

    // We have to pass pass courseId from params in the url 
    try {
      // console.log("This is the should Like state",shouldLike)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      const response =
        await axios.delete(`/api/dislikeCourse/${courseId}?${params.toString()}`);
      const updatedUserCourse = response.data.userCourse
      setUserCourseById(courseId as string, updatedUserCourse)

      if (!shouldDislike) {
        setLikedCourses((courses) =>
          courses.filter((course) => course._id !== courseId)
        );
      }
      await fetchAllLikedCourses()
      toast.success(`${"Course disliked!"}`);
      // console.log("LIKE DEBUG FRONTEND:", {
      //   currentUserCourse,
      //   isLiked,
      // });

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // console.log("LIKE COURSE API ERROR:", {
        //   status: error.response?.status,
        //   data: error.response?.data,
        //   message: error.message,
        // });

        clientLogger.error(`Error ${shouldDislike ? "disliking" : "liking"} course`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      const message = error instanceof Error ? error.message : "Something went wrong while   liking the course.";
      setUserCourseById(courseId as string, previousUserCourse);
      clientLogger.error(`Error ${shouldDislike ? "disliking" : "liking"} course`, message);
      toast.error(`Failed to ${shouldDislike ? "dislike" : "like"} course`);
    } finally {
      setUpdatingLike(courseId, false);
    }
  }
  const fetchAllLikedCourses = useCallback(async (): Promise<void> => {

    try {
      await fetchUserLikedCourses({ page, itemsPerPage, });
      setLikedCourses(useUserCourseStore.getState().cachedLikedCourses);
      setCurrentPage(useUserCourseStore.getState().cachedLikedCurrentPageNumber);
      setTotalPages(useUserCourseStore.getState().cachedLikedTotalPages);
      setTotalCourses(useUserCourseStore.getState().cachedLikedTotalCourses);
      setHasNextPage(useUserCourseStore.getState().cachedLikedHasNextPage);
      setHasPrevPage(useUserCourseStore.getState().cachedLikedHasPrevPage);
      setIsLoading(false);
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : "Unknown error occurred while fetching courses.";
      clientLogger.error("Failed to fetch courses", { message, error });
    } finally {
      setIsLoading(false)
    }
  }, [page, itemsPerPage, toggleLikeCourse, user]);


  const addToCart = (courseId: string) => {
    try {
      const response = axios.post("/api/cart", { courseId });
      toast.success("Course added to cart");
    } catch (error: any) {
      return toast.error(error?.response?.data?.message);
    }
    router.push("/checkout");
  };
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  //Fetch All Liked Courses as soon as the component mounts
  // useEffect(() => {
  //   fetchAllLikedCourses();
  // }, [fetchAllLikedCourses]);

  if (isLoading) {
    return <LikeCoursesPageSkeleton />
  }


  return (
    <div className="min-h-screen w-screen flex flex-col overflow-auto px-8 sm:px-8 ">
      <div className="w-full h-screen py-8 flex flex-col ">
        {likedCourses.length === 0 ? (

          <div className="w-full h-screen  flex justify-center items-center">
            No course Found
          </div>

        ) : (
          <div className="w-full h-full  flex flex-col  gap-4">
            <div className="text-3xl font-semibold flex gap-4 w-full justify-start items-center">
              Liked Courses{" "}
              <motion.span
                // style={{ x }}
                className={`text-4xl origin-left `}
              >
                <FcLike />
              </motion.span>
            </div>

            <div className=" w-full h-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 justify-items-center ">
              {likedCourses.length === 0 ? (
                <div>No courses found</div>
              ) : (
                <>
                  {(likedCourses || []).map((course: CCourse) => {
                    return (
                      <div key={course._id} className="inline-block">
                        <div className="inline-block">
                          <Card className=" h-100 w-75 relative">
                            <CardContent className="">
                              <div className="grid w-full items-center gap-2">
                                <div className="flex flex-col space-y-1.5 w-62.5 h-30 relative">
                                  <Image
                                    src={course?.coverImage || "/placeholder-course.jpg"} // image path or URL
                                    alt="Description of the image"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                  <h2 className="text-xl font-semibold  wrap-break leading-snug">
                                    {course?.title}
                                  </h2>
                                  <p className="text-sm text-muted-foreground">
                                    ({course?.averageRating ? parseInt(course.averageRating.toString()) : 0})
                                  </p>
                                </div>
                                <div className="flex flex-col space-y-1.5 justify-start items-start gap-1">
                                  <h2 className="text-sm font-semibold text-muted-foreground">
                                    {course?.instructorId?.name}
                                  </h2>
                                  <p className="text-2xl text-muted-foreground">
                                    ₹ {course?.price}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex-1 justify-between absolute bottom-4 w-full">
                              <Button

                                variant="outline"
                                onClick={() =>
                                  toggleLikeCourse(course._id)
                                }
                                className="px-10 group"
                              >
                                <span className="w-full flex justify-center group">
                                  <RiDeleteBin6Line />
                                </span>
                              </Button>
                              <Button

                                className=""
                                onClick={() => {
                                  router.push(`/courses/${course._id}`);
                                }}
                              >
                                View Course
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
        {/* {likedCourses.length > 0 && (
          <div className="flex justify-end mt-8 mb-10 ">
            <Button
              onClick={() => {
                addToCart(likedCourses[0]._id);
              }}
              className="h-15 w-50 rounded-none"
            >
              Add to Cart
            </Button>
          </div>
        )} */}
      </div>
      <div className="py-4">
        {totalPages > 1 && (
          <Pagination className=''>
            <PaginationContent className=''>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  isActive={hasPrevPage}
                  className={
                    !hasPrevPage ? "opacity-50 cursor-not-allowed" : ""
                  }
                />
              </PaginationItem>

              {getVisiblePages({ currentPage, totalPages, maxVisiblePages }).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink className=''
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationEllipsis className='' />
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  isActive={hasNextPage}
                  className={
                    !hasNextPage ? "opacity-50 cursor-not-allowed" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default LikedCoursesPageComp;
