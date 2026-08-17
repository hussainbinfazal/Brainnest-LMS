"use client";

import { useParams } from "next/navigation";
import React, { useCallback } from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TiTick } from "react-icons/ti";
import { useRouter } from "next/navigation";
import { LuOctagonAlert } from "react-icons/lu";
import { IoGlobeOutline } from "react-icons/io5";
import { LuCaptions } from "react-icons/lu";
import { RiVerifiedBadgeLine } from "react-icons/ri";
import { Separator } from "@/components/ui/separator";
import StarRating from "@/app/components/shared/StarRating";
import { MdOutlinePeopleAlt } from "react-icons/md";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import { ImQuotesLeft } from "react-icons/im";
import { useMemo } from "react";
import { CircleUser } from "lucide-react";
import { SlBadge } from "react-icons/sl";
import { FaRegHeart } from "react-icons/fa6";
import { IoMdHeart } from "react-icons/io";
import { BsCartCheckFill } from "react-icons/bs";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCartStore } from "@/lib/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { CiTrophy } from "react-icons/ci";
import { IoIosArrowDown } from "react-icons/io";
import { GoDotFill } from "react-icons/go";
import { IoIosArrowUp } from "react-icons/io";
import { FaEye } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { toast } from "sonner";
import { BsCart2 } from "react-icons/bs";
import { TbMessageUser } from "react-icons/tb";
import LoadingBarLoader from "@/app/components/shared/LoadingBarLoader";
import Autoplay from "embla-carousel-autoplay";
import { formatRelativeDate } from "@/utils/date";
import { CAuthUser, CCourse, CLesson, COrder, CProgress, CReview, CSection, CTopic, CUserCourse } from "@/types/client";
import { cn } from "@/lib/utils";
import { CCategoryWithChildren } from "@/lib/getCachedCategory";
import CourseIdPageSkeleton from "./CourseId-Page-Skeleton";
import { IInstructorStats } from "@/lib/getCachedCourse";
import { CCreateReview, zodReviewSchema } from "@/utils/fieldsValidation/Client/reviewSchemaValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { clientLogger } from "@/utils/logger/clientLogger";
import { convertToTotalHours, formatRatingNumber } from "@/utils/timeFormat";
import { useProgressStore } from "@/lib/store/useProgressStore";


interface CourseIdPageCompProps {
  initialCourse: CCourse;
  initialReviews: CReview[];
  allCategories: CCategoryWithChildren[];
  courseCategory: CCategoryWithChildren | null;
  relevantCategoryCourses: CCourse[];
  instructorStats: IInstructorStats | null;
  userCourseStats?: CUserCourse | null;
  otherCoursesByInstructor: CCourse[] | null;
  initialTopic: CTopic | null;
  allLessons: CLesson[] | null;
  allSections: CSection[] | null;
  userProgress: CProgress | null;
  className?: string;
}
export default function CourseIdPageComp({ initialCourse, initialReviews, allCategories, courseCategory, relevantCategoryCourses, instructorStats, userCourseStats, otherCoursesByInstructor, initialTopic, allLessons, allSections, userProgress, className }: CourseIdPageCompProps): React.JSX.Element {
  const router = useRouter();
  const { courseId } = useParams();
  const user: CAuthUser | null = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const { fetchCart, cart } = useCartStore();
  const [course, setCourse] = useState<CCourse>(initialCourse);
  const [lessons, setLessons] = useState<CLesson[]>(allLessons ?? []);
  const [sections, setSections] = useState<CSection[]>(allSections ?? []);
  const [reviews, setReviews] = useState<CReview[]>(initialReviews ?? []);
  const [userCourse, setUserCourse] = useState<CUserCourse | null>(userCourseStats ?? null)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(userCourse?.isLiked ?? false);
  const [viewSection, setViewSection] = useState<boolean>(false);
  const [viewSectionId, setViewSectionId] = useState<string | null>("");
  const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [coursesByInstructor, setCoursesByInstructor] = useState<CCourse[]>(otherCoursesByInstructor || []);
  const [totalReviewsOfInstructor, setTotalReviewsOfInstructor] = useState<number>(instructorStats?.totalReviews || 0);
  const [totalCoursesOfInstructor, setTotalCoursesOfInstructor] = useState<number>(instructorStats?.totalCourses || 0);
  const [isAlreadyAdded, setIsAlreadyAdded] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(userCourse?.isEnrolled ?? false);
  const [category, setCategory] = useState<CCategoryWithChildren | null>(courseCategory);
  const [order, setOrder] = useState<COrder | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(userCourse?.isCompleted ?? false);
  const [rating, setRating] = useState<number>(course.averageRating ?? 0);
  const [comment, setComment] = useState<string>("");
  const [newReview, setNewReview] = useState<string>("");
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isViewInfo, setIsViewInfo] = useState<boolean>(false);
  const [chatId, setChatId] = useState<string>("");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [topic, setTopic] = useState<CTopic | null>(initialTopic);
  const [userProgressData, setUserProgressData] = useState<CProgress | null>(userProgress);

  const form = useForm<CCreateReview>({
    resolver: zodResolver(zodReviewSchema),
    defaultValues: {
      rating: 0,
      comment: ""
    }

  });
  const isLessonCompletedFromStore = useProgressStore(
    (state) => state.isLessonCompleted
  );
  const fetchCourseProgress = useProgressStore(
  (state) => state.fetchCourseProgress
);
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = form
  const onSubmit = async (data: CCreateReview): Promise<void> => {
    setLoading(true);
    try {
      const reviewData = {
        // user
        rating: data.rating,
        comment: data.comment.trim(),
      };

      const response = await axios.post(`/api/courses/rate/${courseId}`, {
        reviewData,
      });
      // setReviews((prevReviews) => [
      //   ...(prevReviews || []),
      //   response.data.newReview,
      // ]);
      toast.success("Thanks for your review!");
    } catch (error: unknown) {
      clientLogger.error("This is the error in this :", error);
      toast.error("Something went wrong!, Please try again later");
    } finally {
      setLoading(false);
    }
  };


  const formattedDate = useMemo((): string => {
    const dateString = course?.updatedAt || course?.createdAt;
    if (!dateString) return "No date available";

    const date: Date = new Date(dateString);
    const month: number = date.getUTCMonth() + 1;
    const year: number = date.getUTCFullYear();
    return `Last updated on ${month}/${year}`;
  }, [course?.updatedAt, course?.createdAt]);

  const totalCourseDuration: string = useMemo((): string => {
    if (!course || !Array.isArray(allLessons)) return "0 mins";

    const totalMinutes: number = allLessons.reduce((total, lesson) => {
      return total + ((lesson.durationInSeconds / 60) || 0);
    }, 0);

    const hours: number = Math.floor(totalMinutes / 60);
    const minutes: number = Number(totalMinutes) % 60;

    return hours > 0 ? `${hours} h ${minutes} m` : `${minutes} m`;
  }, [course]);

  const totalMinutesOfLesson = (seconds: number): string => {
    const minutes: number = seconds / 60;
    const min: number = minutes % 60;
    return min > 0 ? `${min} min` : `${Math.floor(minutes / 60)} h`;
  };
  const getTotalMinutesOfSection = (sectionId: string): number => {
    if (!allLessons) return 0
    const sectionLessons = allLessons.filter((lesson) => lesson.sectionId === sectionId);
    const totalMinutes: number = sectionLessons.reduce((total, lesson) => {
      return total + ((lesson.durationInSeconds / 60) || 0);
    }, 0);
    return totalMinutes
  }
  const checkCompletedLesson = async (lessonId: string) : Promise<void> => {
    try {
      const completed = isLessonCompletedFromStore(
        courseId as string,
        lessonId
      );
      setIsLessonCompleted(completed);
      setIsLoading(false);
    } catch (error: unknown) {
      clientLogger.error("This is the error in this :", error);
    }

  };

  // // chat inititalization //
  // //Move this Logic to the chat server side 
  // const handleInitializeChat = async (): Promise<void> => {
  //   toast.loading("Initializing chat...");
  //   try {
  //     const response = await axios.post("/api/chat", {
  //       sender: user?._id,
  //       receiver: course?.instructor?._id,
  //     });
  //     const data = response.data.chat;
  //     setChatId(data?._id);
  //   } catch (error: any) {
  //     logger.error(error);
  //     throw error;
  //   } finally {
  //     toast.dismiss();
  //     router.push(`/chat`);
  //   }
  // };


  const [isExpanded, setIsExpanded] = useState(false);
  const description = course?.description || "No description available.";
  const characterLimit = 100;

  const toggleExpanded = () => setIsExpanded((prev) => !prev);
  const shouldTruncate = description.length > characterLimit;
  const ranndomCoursesOnRating = useMemo(() => {
    if (!course || !course.reviews || course.reviews.length === 0) return [];
    if (!reviews || !Array.isArray(reviews)) return [];
    const randomCourseLength = Math.floor(Math.random() * 12) + 1;
    const shuffled = [...reviews].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, randomCourseLength);
  }, [course, reviews]);


  const getSectionLessons = (sectId: string): CLesson[] => {
    if (!allLessons) return [];
    const sectionLessons = allLessons.filter((lesson) => lesson.sectionId === sectId);
    return sectionLessons
  }

  const fetchUser = async (): Promise<void> => {
    try {
      const response = await axios("/api/users/me");
      if (response.data.user) {
        setAuthUser(response.data.user);
      }
    } catch (error: unknown) {
      clientLogger.error("Something went wrong while fetching the user")
    }
  };
  const likeCourse = async (): Promise<void> => {
    if (!user) {
      return alert("Please login first");
    }
    // params mai user id pass karni   hai
    try {
      if (!courseId) return alert("Error");
      const response = await axios.post(`/api/likeCourse/${courseId}`);
      setUserCourse(response.data.userCourse)
      toast.success("Course liked! You'll find it in your Liked Courses.");
    } catch (error: unknown) {
      clientLogger.error("Error liking course", error);
      toast.error("Error liking course");
    }
  };

  const unlikeCourse = async (): Promise<void> => {
    if (!user) {
      return alert("Please login first");
    }
    // params mai user id pass karni   hai
    try {
      if (!courseId) return alert("Something went wrong");
      const reponse = await axios.delete(`/api/dislikeCourse/${courseId}`);
      setUserCourse(reponse.data.userCourse)
      toast.success("Course Disliked!");
    } catch (error: any) {
      throw new error("Error liking course");
    }
  };
  const handleAddToCart = async (courseId: string) => {
    const toastId = toast.loading("Adding to cart...");
    try {
      const response = await axios.post(`/api/cart/${courseId}`);
      toast.dismiss(toastId);
      fetchCart();
      fetchUser();
      toast.success("Course added to cart");
    } catch (error: any) {
      clientLogger.error(error);
      toast.error(error?.message || "Something went wrong");
      toast.dismiss(toastId);
      throw error;
    }
  };
  const handleRemoveFromCart = async (courseId: string) => {
    const toastId = toast.loading("Adding to cart...");

    try {
      const response = await axios.delete(`/api/cart/${courseId}`);
      toast.dismiss(toastId);
      toast.success("Course removed from cart");
      fetchCart();
    } catch (error: any) {
      toast.dismiss(toastId);

      throw error;
    }
  };
  // useEffect(() => {
  //   if (user && user.likedCourses && user?.likedCourses?.includes(Array.isArray(courseId) ? courseId[0] : courseId || "")) {
  //     setIsLiked(true);
  //   } else {
  //     setIsLiked(false);
  //   }
  // }, [user, cart]);

  // useEffect((): void => {
  //   if (user && course) {
  //     const isUserEnrolled = user.enrolledCourses?.some(
  //       (item) => item.toString() === course._id.toString()
  //     );
  //     setIsEnrolled(isUserEnrolled);
  //   }
  // }, [user, course]);

  const verifyPayment = async (paymentData: any): Promise<any> => {
    try {
      // console.log("Verifying payment with user:", user);
      // console.log("User ID:", user?._id);

      const userId: string | undefined = user?._id;
      if (!user || !userId) {
        throw new Error("User not authenticated");
      }

      const response = await axios.post("/api/order/payment/verify", {
        orderId: paymentData.razorpay_order_id,
        paymentId: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature,
        courseId: course._id,
        userId: userId,
        amount: course?.price,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Payment verification failed");
      }

      toast;
      return response.data;
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      // Convert axios error to a more readable format
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(
          error.response.data.message ||
          `Payment verification failed with status ${error.response.status}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error("No response received from verification server");
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(
          error.message || "Error setting up verification request"
        );
      }
    }
  };
  const handleBuyNow = async (): Promise<void> => {
    try {
      // Check if user is logged in
      if (!user) {
        toast.error("Please login first");
        return router.push("/login");
      }

      // Show loading state
      toast.loading("Processing your purchase...");

      // Create an order object with course details
      const orderData = {
        courseId: course._id,
        amount: course.price,
      };

      // Call API to create order and process payment
      const response = await axios.post(`/api/order/create`, orderData);
      const data = response?.data;
      setOrder(data);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Number(course?.price) * 100, // Amount in paisa
        currency: "INR",
        name: "Brainnest LMS",
        description: `Purchase: ${course.title}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            toast.loading("Verifying payment...");
            const verification = await verifyPayment(response);

            if (verification.success) {
              toast.success(
                "Payment successful! You now have access to the course."
              );
              setIsPaid(true);
              // Redirect to course CourseIdPage or dashboard
              toast.dismiss();
              router.push(`/courses/${course?._id}`);
              fetchUser();
            } else {
              toast.error(
                "Payment verification failed. Please contact support."
              );
              // add verification failure handling here like order failed
              toast.error(verification.data.message);
            }
          } catch (error: any) {
            alert("Payment verification failed. Please contact support.");
            toast.error(error.message || "Payment verification failed");
            toast.dismiss();
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phoneNumber || "",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razor = new (window as any).Razorpay(options);
      razor.open();
      toast.dismiss();

      if (response.data.success) {
        toast.success("Course purchased successfully!");

        // Refresh user data to update enrolled courses
        await fetchUser();

        // Redirect to course view CourseIdPage
      } else {
        toast.error(response.data.message || "Failed to process payment");
      }
    } catch (error: unknown) {
      toast.dismiss();
      // error.response?.data?.message || 
      toast.error("Something went wrong");
      alert("Failed to initiate payment. Please try again.");
    }
  };



  const checkAlreadyAdded = (): void => {
    let isInCart = false;
    isInCart = cart.courses?.some(
      (cartCourse: CCourse) => cartCourse?._id === course?._id
    );
    setIsAlreadyAdded(isInCart);
  };

  // const filteredCourseReviews = () => {
  //   if (!course?.reviews) return [];

  //   const filteredReviews = course.reviews.filter((item) => item.rating > 3);

  //   if (course.reviews.length < 5) {
  //     return course.reviews;
  //   } else {
  //     return filteredReviews.slice(0, 9);
  //   }
  // };
  const handleDownloadCertificate = async (): Promise<void> => {
    try {
      const response = await axios.get(`/api/certificate/${courseId}`, {
        responseType: "blob", // Important for binary data
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded successfully!");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect((): void => {
    // Make sure cart is fetched when component mounts
    if (user) {
      fetchCart();
    }
  }, [user]);
  useEffect((): void => {
    if (user && course && userProgressData?.percentageCompleted === 100) {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }
  }, [user, course]);

  useEffect((): void => {
    const checkLessons = async (): Promise<void> => {
      if (course?.lessons?.length && user) {
        for (const lesson of course.lessons) {
          if (lesson._id) {
            await checkCompletedLesson(lesson._id);
          }
        }
      }
    };
    checkLessons();
  }, [course?.lessons]);


  useEffect((): void => {
    if (user && cart) {
      checkAlreadyAdded();
    }
  }, [user, cart]);
  useEffect((): void => {
    fetchUser();
  }, []);
  useEffect(() => {

    if (initialCourse && initialReviews.length > 0 && allCategories.length > 0 && courseCategory, relevantCategoryCourses.length > 0 && instructorStats && userCourse && otherCoursesByInstructor && initialTopic && allLessons && allSections && userProgress) {

      setIsLoading(false);
    }

  }, [initialCourse, initialReviews, allCategories, courseCategory, relevantCategoryCourses, instructorStats, userCourse, otherCoursesByInstructor, initialTopic, allLessons, allSections, userProgress]);
  useEffect(() => {
  if (!courseId) return;

  fetchCourseProgress(courseId as string);
}, [courseId, fetchCourseProgress]);
  if (isLoading) {
    return <CourseIdPageSkeleton />;
  }

  return (
    <div className={cn("relative w-full min-h-screen flex flex-col gap-6  py-18 pt-0 ", className)}>
      {/* {isLoading && (
        <div className="w-full relative">
          <LoadingBarLoader isLoading={isLoading} />
        </div>
      )} */}
      <div className="absolute top-0 left-0 w-full h-1/2 dark:bg-black bg-white z-[-1]" />
      {(
        <div className="w-[90%] md:w-[70%] lg:w-[60%] bg-transparent mx-auto flex flex-col justify-start items-center relative">
          <div className="relative w-full h-75 overflow-hidden">
            <Image alt="" src={course?.coverImage ? course?.coverImage : ""} fill className="rounded-lg" />
          </div>
        </div>
      )}
      <div className="relative w-[90%] md:w-[90%] lg:w-[60%] bg-transparent mx-auto flex flex-col justify-start items-center h-full gap-6 min-h-screen pt-2">
        {(
          !isEnrolled && (
            <div className="absolute right-0 top-2 w-10 h-10 rounded-full flex items-center justify-center border border-gray-300">
              {isLiked ? (
                <IoMdHeart
                  className="text-xl text-red-500 cursor-pointer"
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      toast.error("Please login first");
                      return;
                    }
                    unlikeCourse();
                  }}
                />
              ) : (
                <FaRegHeart
                  className="text-xl cursor-pointer"
                  onClick={(): void => {
                    if (!user) {
                      router.push("/login");
                      toast.error("Please login first");
                      return;
                    }
                    likeCourse();
                  }}
                />
              )}
            </div>
          )
        )}
        {(
          isEnrolled && (
            <div
              className="absolute right-0 top-2 w-10 h-10 rounded-full flex items-center justify-center border border-gray-300"
              onMouseEnter={() => {
                setIsViewInfo(true);
              }}
              onMouseLeave={() => {
                setIsViewInfo(false);
              }}
            >
              <TbMessageUser className="text-2xl relative cursor-pointer" />
              {isViewInfo && (
                <Card className="w-87.5 absolute right-4 bottom-4 z-99 rounded-br-none">
                  <CardHeader className=''>
                    <CardTitle className=''>Chat with Instructor</CardTitle>
                  </CardHeader>
                  <CardContent className=''>
                    <form>
                      <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                          <p className="text-sm text-gray-600">
                            Connect directly with your instructor. Ask
                            questions, get guidance, or request feedback. Use
                            your available message credits wisely.
                          </p>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button size='default' className='' variant="outline">Cancel</Button>
                    <Button
                      variant='default'
                      size='default'

                      onClick={() => {
                        if (!user) {
                          router.push("/login");
                          toast.error("Please login first");
                          return;
                        }
                        // handleInitializeChat();
                      }}
                      className={"cursor-pointer"}
                    >
                      Start Chat
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )
        )}

        {(
          !isEnrolled && (
            <div className="absolute right-12 top-2 w-10 h-10 rounded-full flex items-center justify-center border border-gray-300">
              {isAlreadyAdded ? (
                <BsCartCheckFill
                  className="text-xl cursor-pointer"
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      toast.error("Please login first");
                      return;
                    }
                    handleRemoveFromCart(course._id);
                  }}
                />
              ) : (
                <BsCart2
                  className="text-xl cursor-pointer"
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      toast.error("Please login first");
                      return;
                    }
                    handleAddToCart(course._id);
                  }}
                />
              )}
            </div>
          )
        )}
        {(
          <div className="absolute right-33 top-2 w-10 h-10  flex items-center justify-center  border-gray-300 cursor-pointer">
            {!isEnrolled && (
              <Button
                size='default'
                variant="default"
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    toast.error("Please login first");
                    return;
                  }
                  handleBuyNow();
                }}
                className="cursor-pointer"
              >
                Buy Now
              </Button>
            )}
          </div>
        )}
        {(
          <div className="absolute right-30 top-2 w-10 h-10  flex items-center justify-center  border-gray-300">
            {isCompleted && (
              <Button
                size='default'
                className=""
                variant='default'
                onClick={(): void => {
                  if (!user) {
                    router.push("/login");
                    toast.error("Please login first");
                    return;
                  }
                  handleDownloadCertificate();
                }}
              >
                Download Certificate
              </Button>
            )}
          </div>
        )}
        <div className="w-full flex flex-col items-start justify-center gap-3 pt-12 md:pt-0">
          <p className="dark:text-white text-black text-2xl sm:text-3xl lg:text-4xl capitalize whitespace-normal wrap-break-word line-clamp-3 leading-tight cursor-pointer">
            {course?.title}
          </p>
          {initialTopic && (
            <p>{topic?.name}</p>
          )}
          {initialTopic && (
            <p>{topic?.description}</p>
          )}
          {(
            <Badge variant='default' className=''>Bestseller</Badge>
          )}
          {(
            <p className="dark:text-white text-black text-2xl capitalize whitespace-normal wrap-break-word line-clamp-2">
              ₹ {Number(course?.price)}
            </p>
          )}
        </div>

        <div className="flex gap-2 w-full   justify-start items-center">
          <span className="flex gap-2  items-center">
            {(
              <LuOctagonAlert />
            )}
            {""}
            {(
              <span className="text-sm">{formattedDate}</span>
            )}
          </span>
          <span className="flex gap-2  items-center">
            {(
              <IoGlobeOutline />
            )}
            {""}
            {(
              <p>{course?.language}</p>
            )}
          </span>
          <span className="flex gap-2 items-center">
            {(
              <LuCaptions />
            )}
            {""}
            {(
              course?.language
            )}
          </span>
        </div>
        <div className="w-full h-30 flex flex-row justify-start items-center border-2 border-gray-300 rounded-lg mt-4">
          {(
            <span className="w-1/5 h-full flex justify-center items-center">
              <RiVerifiedBadgeLine className="text-4xl" />
            </span>
          )}

          {(
            <span className="w-2/5 h-full flex justify-start  items-center md:pl-4">
              <p className="lg:text-[13px] text-[10px] text-center leading-tight whitespace-pre-line font-semibold">
                Access this top-rated course,plus <br /> 1,300+ more top rated
                courses <br />
                with a brainnest
              </p>
            </span>
          )}
          <Separator
            orientation="vertical"
            className="h-3/5! w-px bg-gray-300 mx-2 hidden sm:block"
          />
          {(
            <span className="w-1/5 hidden  sm:flex flex-col gap-1 justify-center items-center wrap-break text-center">
              <StarRating rating={Number(course?.averageRating) || 0} />
              <p>{Number(course?.averageRating) || 0} ratings</p>
            </span>
          )}
          <Separator
            orientation="vertical"
            className="h-3/5! w-px bg-gray-300 mx-2"
          />

          {(
            <span className="w-2/5 sm:w-1/5 flex flex-col gap-1 justify-center items-center wrap-break text-center">
              <MdOutlinePeopleAlt className="text-2xl" />
              <p>{course?.enrolledStudents?.length || 0} learners</p>
            </span>
          )}
        </div>
        {(
          <div className="w-full min-h-25 flex flex-col justify-start items-start border-2 py-2 px-4 mt-4  ">
            {(
              <h3 className="text-2xl font-semibold">What you'll learn</h3>
            )}
            {(
              <ul className="list-none list-inside dark:text-white text-black  pl-3 py-3 ">
                {Array.isArray(course?.whatYouWillLearn) &&
                  course.whatYouWillLearn.map((item, index) => (
                    <li key={index}>
                      <TiTick className="inline-block text-green-500 mr-2 text-2xl" />
                      {item || "Untitled Topic"}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
        {(
          <div className="w-full flex flex-col  justify-start items-start ">
            <h3 className="text-2xl font-semibold ">Explore Releated Topics</h3>
            <div className="w-full flex gap-2 mt-4">
              {courseCategory && courseCategory?.children?.map(
                (subCat) =>
                (
                  <Link
                    key={subCat.name}
                    href={`/courses/${subCat.slug}`}
                    className=" hover:underline border-2  px-6 py-2 rounded shadow-sm cursor-pointer"
                  >
                    {subCat.name}
                  </Link>
                )
              ) || (
                  <p className="text-sm text-gray-500">
                    No related topics found.
                  </p>
                )}
            </div>
          </div>
        )}
        {( //This is the introduction of the course
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            <h3 className="text-2xl font-semibold ">This course includes :</h3>
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-2 mt-4 px-2">
              <span className="w-1/2 h-full flex justify-start  items-center">
                {(
                  <div className="flex gap-3 min-h-5 justify-start items-center">
                    <MdOutlineOndemandVideo className="text-2xl" />
                    <p className="whitespace-pre">
                      : {totalCourseDuration || 0} on demand video
                    </p>
                  </div>
                )}
              </span>
              {(
                <span className="flex gap-3 min-h-5 justify-start items-center">
                  <CiTrophy className="text-2xl" />{" "}
                  <p>Certificate of completion</p>
                </span>
              )}
              <span className="w-1/2 h-full flex justify-start  items-center"></span>
            </div>
          </div>
        )}
        {/* {//Lesson and section} */}
        {(
          // {//Lesson Content}
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            {(
              <h3 className="text-2xl font-semibold ">Course content</h3>
            )}
            {/* {We are about to work on this component} */}
            <div className="w-full min-h-25 flex flex-col gap-2 mt-4 px-2">
              {
                sections.map((section: CSection) => {
                  const sectionLessons: CLesson[] = lessons.filter((l) => l.sectionId === section._id);
                  return (
                    <div
                      key={section?.title}
                      className="w-full flex flex-col justify-between items-center relative"
                    >
                      <div
                        className={`w-full min-h-17.5 justify-between items-center flex border-2 border-gray-300 rounded px-4 ${section._id === viewSectionId
                          ? "rounded-b-none"
                          : "rounded"
                          }`}
                      >
                        {(
                          <span className="w-1/2 flex justify-start items-center gap-4">
                            {viewSectionId === section?._id ? (
                              <IoIosArrowUp
                                onClick={() => {

                                  setViewSection(false)
                                  setViewSectionId((null));
                                }}
                                className="cursor-pointer"
                              />
                            ) : (
                              <IoIosArrowDown
                                onClick={() => {
                                  setViewSection(true)
                                  setViewSectionId((section?._id));

                                }}
                                className="cursor-pointer"
                              />
                            )}{" "}
                            {section.title}
                          </span>
                        )}
                        <span className="w-1/2 flex justify-end items-center gap-4">
                          {/* {lesson?.description} */}
                          <GoDotFill />
                          <p>{getTotalMinutesOfSection(section._id ?? "")} min</p>
                        </span>
                      </div>
                      {/* put the matching lesson Id here after the view Lesson */}
                      {viewSection && viewSectionId === section._id && (
                        ///Section's lesson here 
                        getSectionLessons(viewSectionId).map((lesson: CLesson) => {
                          return (<div className={`w-full min-h-25 border-2 border-t-none flex justify-between px-4 ${section._id === viewSectionId
                            ? "rounded-b-none"
                            : "rounded"
                            }`}>
                            <p className="flex items-center gap-3 ">
                              <MdOutlineOndemandVideo className="text-xl" />{" "}
                              {lesson?.name}
                            </p>{" "}
                            <p className="flex items-center gap-4">
                              {user && (
                                <FaEye
                                  className={`${isLessonCompleted
                                    ? "text-blue-500 "
                                    : " dark:data-[state=active]:text-white"
                                    } mr-2 cursor-pointer`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/courses/${course?._id}/${lesson?._id}`
                                    );
                                  }}
                                />
                              )}
                              {totalMinutesOfLesson(lesson.durationInSeconds)}
                            </p>




                          </div>)
                        })

                      )}
                    </div>
                  );

                })
              }

            </div>
          </div>
        )}
        {(
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            {(
              <h3 className="text-2xl font-semibold px-2">Requiremnts</h3>
            )}
            <div className="w-full min-h-25 flex flex-col justify-start gap-2 mt-4 px-2">
              <ul>
                {Array.isArray(course?.requirements) &&
                  course.requirements.map((item: string, index: number) => (
                    <li
                      key={index}
                      className="flex gap-2 justify-start items-center"
                    >
                      <GoDotFill className="inline-block  mr-2 text-lg" />
                      <p className="text-2xl">{item || "Untitled Topic"}</p>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
        {(
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            <h3 className="text-2xl font-semibold px-2">Description</h3>
            <div className="w-full min-h-25 flex flex-col gap-2 mt-4 px-2 ">
              <p>
                {isExpanded || !shouldTruncate
                  ? description
                  : `${description.slice(0, characterLimit)}...`}
              </p>

              {shouldTruncate && (
                <button
                  onClick={toggleExpanded}
                  className="text-blue-500 hover:underline w-fit px-4 py-2 border flex gap-2 items-center"
                >
                  {isExpanded ? "Show less" : "Show more"}{" "}
                  {isExpanded ? (
                    <IoIosArrowUp
                      onClick={() => { }}
                      className="cursor-pointer"
                    />
                  ) : (
                    <IoIosArrowDown
                      onClick={() => { }}
                      className="cursor-pointer"
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        {(
          (course?.reviews?.length || 0) > 0 && (
            <div className="w-full flex flex-col  justify-start items-start mt-4">
              <div className="w-full min-h-12.5 flex flex-col gap-2 mt-4 px-2 ">
                <div className="w-full">
                  <div className="mb-4 flex flex-row gap-2 w-full h-full items-start  jsutify-center">
                    <p>Course Reviews</p>{" "}
                    <GoDotFill className="inline-block mx-2 my-auto" />
                    <p className="text-gray-600">
                      {course?.averageRating || 0} ratings
                    </p>
                  </div>
                  <div className="grid-cols-6 flex-1">
                    <Carousel opts={{}} setApi={() => { }} plugins={[]} className="w-full">
                      <CarouselContent className="">
                        {(course?.reviews?.length === 0) ? (
                          <CarouselItem className=''>
                            <Skeleton className="w-70 h-75 rounded-md" />
                          </CarouselItem>
                        ) : (
                          (ranndomCoursesOnRating || []).map(
                            (review, index) => (
                              <CarouselItem
                                key={`${index}-${index}`}
                                className="md:basis-1/3 lg:basis-1/3 xl:basis-1/3 2xl:basis-1/4 gap-3"
                              >
                                <div className=" my-2 relative">
                                  <Link href={`/`}>
                                    <Card className="w-62.5 h-70 my-2 relative pt-0 pb-3">
                                      <CardHeader className="w-full h-1/8 flex justify-start items-center relative -mb-4">
                                        <ImQuotesLeft />
                                      </CardHeader>
                                      <CardContent className="min-h-1/5 max-h-2/5 w-full flex justify-center relative ">
                                        <p className="text-sm">
                                          {review?.comment ||
                                            "Udemy gives you the ability to be persistent. I learned exactly what I needed to know in the real world. It helped me sell myself to get a new role."}
                                        </p>
                                      </CardContent>
                                      <CardFooter className={"h-2/5"}>
                                        <div className="w-full flex justify-start items-center   gap-2">
                                          <div className="h-full w-1/3 flex flex-col items-center justify-start">
                                            <div className="relative w-12.5 h-12.5 rounded-full overflow-hidden flex items-center justify-start bg-[#F6F7F9]">
                                              <Image
                                                src={
                                                  review?.user?.profileImage ||
                                                  "https://img-c.udemycdn.com/user/100x100/12345678.jpg"
                                                }
                                                alt={review?.user?.name || "User"}
                                                fill
                                                className="object-cover rounded-full"
                                              />
                                            </div>
                                          </div>
                                          <div className="h-full flex flex-col  w-2/3">
                                            <p className="capitalize text-sm font-semibold wrap-break-word leading-snug">
                                              {review?.user?.name ||
                                                "John Doe"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {review?.createdAt ||
                                                review?.updatedAt ||
                                                "2 days ago"}
                                            </p>
                                          </div>
                                        </div>
                                      </CardFooter>
                                    </Card>
                                  </Link>
                                </div>
                              </CarouselItem>
                            )
                          )
                        )}
                      </CarouselContent>
                      <CarouselPrevious className='' />
                      <CarouselNext className={"ml-4"} />
                    </Carousel>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        {(
          <div className="w-full flex flex-col  justify-between items-start mt-4">
            {(
              <h3 className="text-2xl font-semibold px-2">Instructor</h3>
            )}
            <div className="w-full min-h-12.5 flex flex-row justify-between items-center gap-2 mt-4 px-2">
              <div className="w-1/6 ">
                {course?.instructorId?.profileImage ? (
                  <div className="w-15 h-15 max-w-25 rounded-full relative ">
                    <Image
                      src={course.instructorId.profileImage}
                      alt={course.title}
                      fill
                      className="object-cover rounded-full "
                    />
                  </div>
                ) : (
                  <CircleUser className="w-8 h-8" />
                )}
              </div>
              <p className="text-lg font-semibold w-2/5 flex items-center">
                {course?.instructorId?.name}
              </p>
              <p className="flex gap-2 items-center justify-end w-1/6 ">
                <MdOutlineOndemandVideo className="text-xl" />
                {totalCoursesOfInstructor}
              </p>
              <p className="flex gap-2 items-center justify-end w-1/6 text-xl">
                <FaStar /> {totalReviewsOfInstructor || 0}
              </p>
              <p className="flex gap-2 items-center justify-end w-1/6 text-xl">
                <SlBadge /> {totalReviewsOfInstructor || 0}
              </p>
            </div>
          </div>
        )}
        {(user &&
          // Other Courses By same instructor
          (<div className="w-full flex flex-col  justify-between items-start mt-8 px-2">
            <div className="w-full">
              <div className="mb-4 flex flex-col gap-2 w-full h-full">
                <h2 className="text-2xl font-semibold ">
                  Explore other courses by {course?.instructorId?.name}{" "}
                </h2>
              </div>
              <div className="grid-cols-6 flex-1">
                <Carousel setApi={() => { }} opts={{}} plugins={[]} className="w-full">
                  <CarouselContent className=''>
                    {relevantCategoryCourses.length === 0 ? (
                      <CarouselItem className=''>
                        <Skeleton className="w-70 h-75 rounded-md" />
                      </CarouselItem>
                    ) : (
                      (relevantCategoryCourses || []).map((course, index) => (
                        <CarouselItem
                          key={`${index}-${index}`}
                          className="md:basis-1/3 lg:basis-1/3 xl:basis-1/3 2xl:basis-1/3 gap-3"
                        >
                          <div className=" my-2 relative">
                            <Link href={`/courses/${course._id}`}>
                              <Card className="w-62.5 h-75 my-2 relative pt-0 pb-3">
                                <CardContent className="h-3/5 w-full flex justify-center relative p-0">
                                  {course?.coverImage ? (
                                    <div className="relative w-full h-full rounded-t-xl  overflow-hidden">
                                      <Image
                                        src={course.coverImage}
                                        alt={course.title}
                                        fill
                                        className="object-cover p-0"
                                      />
                                    </div>
                                  ) : (
                                    <Skeleton className="w-full h-50" />
                                  )}
                                </CardContent>
                                <CardFooter className={"flex-1"}>
                                  <div className="w-full flex flex-col flex-1 items-start justify-center gap-2">
                                    <p className="capitalize text-lg font-semibold wrap-break-word leading-snug">
                                      {course.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {(courseCategory ?
                                        courseCategory?.name
                                          .charAt(0)
                                          .toUpperCase() +
                                        course?.category?.name.slice(1) : "")}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      ₹{(Number(course?.price || 0))}
                                    </p>
                                    <div className="flex gap-2">
                                      <Badge className='' variant="outline">
                                        {course?.averageRating &&
                                          formatRatingNumber(course.averageRating)}
                                      </Badge>
                                      <Badge className='flex gap-2' variant="outline">
                                        {course?.totalDurationInSeconds &&
                                          convertToTotalHours(
                                            course.totalDurationInSeconds
                                          )}{" "}
                                        hours
                                      </Badge>
                                      {/* <Badge className='flex gap-2' variant="outline">
                                        {course?.category?.subCategories[0]}
                                      </Badge> */}
                                      <Badge className='flex gap-2' variant="outline">
                                        {courseCategory?.parent?.name}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardFooter>
                              </Card>
                            </Link>
                          </div>
                        </CarouselItem>
                      ))
                    )}
                  </CarouselContent>
                  <CarouselPrevious className='' />
                  <CarouselNext className={"ml-4"} />
                </Carousel>
              </div>
            </div>
          </div>)
        )}
        {(user &&
          (<div className="w-full flex flex-col  justify-between items-start mt-8 px-2">
            <div className="w-full ">
              <form id="create-review-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4 flex flex-col gap-2 w-full h-full">
                  <h2 className="text-2xl font-semibold ">Add your review</h2>
                </div>
                <div className="grid-cols-6 flex-1">
                  <div className="">
                    <Controller
                      name="comment"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          className=''
                          placeholder="Type your review here."
                          value={field.value}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => field.onChange(e.target.value)}
                        />
                      )}
                    />

                  </div>

                  <div className="flex flex-col items-start gap-2 mt-3">
                    <div className="w-full flex justify-center items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, index: number) => {
                          const currentRating: number = index + 1;
                          return (
                            <label key={index}>
                              <input
                                type="radio"
                                value={currentRating}
                                {...form.register("rating", { required: true })}
                                className="hidden"

                              />
                              {form.formState.errors.rating && form.formState.errors.rating.type === "required" && (
                                <p className="text-sm text-destructive">
                                  {form.formState.errors.rating.message}
                                </p>
                              )}
                              <FaStar
                                size={28}
                                className={`cursor-pointer transition-colors ${currentRating <= (hover || rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                                  }`}
                                onMouseEnter={(): void => setHover(currentRating ?? null)}
                                onMouseLeave={(): void => setHover(null)}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>)

        )}
        {(
          <div className="w-full">
            <div className="mb-4 flex flex-col gap-2 w-full h-full">
              <h2 className="text-3xl font-bold ">
                See what others are achieving through learning{" "}
              </h2>
              <p className="text-gray-600">
                Know the achievers of the world through their stories
              </p>
            </div>
            {/*This is ample review section */}
            <div className="w-full grid-cols-6 flex-1">
              <Carousel className="w-full" opts={{
                align: "start",
                loop: true,
                dragFree: true,
              }}
                setApi={() => { }}
                plugins={[
                  Autoplay({
                    delay: 2500,
                    stopOnInteraction: false,
                    stopOnMouseEnter: true,
                  }),
                ]}>
                <CarouselContent className="w-full -ml-1">
                  {(
                    (reviews ? reviews : []).map((review: CReview, index: number) => (
                      <CarouselItem key={`${index}-${index}`} className="px-2 sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <div className=" my-2 relative">
                          <Link href={`/`}>
                            <Card className=" h-70 my-2 relative pt-0 pb-3">
                              <CardHeader className="w-full h-1/8 flex justify-start items-center relative -mb-4">
                                <ImQuotesLeft />
                              </CardHeader>
                              <CardContent className="min-h-1/5 max-h-2/5 w-full flex justify-center relative ">
                                <p className="text-sm wrap-break-word line-clamp-5">{review?.comment}</p>
                              </CardContent>
                              <CardFooter className={"h-2/5"}>
                                <div className="w-full flex justify-start items-center   gap-2">

                                  <div className="h-full w-1/3 flex flex-col items-center justify-start">
                                    <div className="relative w-12.5 h-12.5 rounded-full overflow-hidden flex items-center justify-center bg-[#F6F7F9] dark:text-black">
                                      {review?.user?.profileImage ? (<Image src={review?.user?.profileImage || "/user.png"} alt={review?.user?.name || "user"} width={50} height={50} className="w-full h-full object-cover" />) : (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)}

                                    </div>

                                  </div>
                                  <div className="h-full flex flex-col  w-2/3">
                                    <p className="capitalize text-sm font-semibold wrap-word-break leading-snug">{review?.user?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatRelativeDate(review?.createdAt || review?.updatedAt)}
                                    </p>
                                  </div>

                                </div>
                              </CardFooter>
                            </Card>
                          </Link>
                        </div>
                      </CarouselItem>
                    ))
                  )}
                </CarouselContent>
                <CarouselPrevious className="" />
                <CarouselNext className={"ml-4"} />
              </Carousel>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};


