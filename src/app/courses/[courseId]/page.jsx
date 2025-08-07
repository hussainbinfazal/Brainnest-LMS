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
import { useCourseStore } from "@/lib/store/useCourseStore";
import { getCategoryImagePath } from "@/app/components/getCategoryImagePath";
import Link from "next/link";
import { ImQuotesLeft } from "react-icons/im";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";
import { CircleUser } from "lucide-react";
import { SlBadge } from "react-icons/sl";
import { FaRegHeart } from "react-icons/fa6";
import { IoMdHeart } from "react-icons/io";
import { BsCartCheckFill } from "react-icons/bs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Script from "next/script";
import {
  Card,
  CardContent,
  CardDescription,
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
import { LuDot } from "react-icons/lu";
import { FaStar } from "react-icons/fa";
import { toast } from "sonner";
import { BsCart2 } from "react-icons/bs";
import { TbMessageUser } from "react-icons/tb";
import { BarLoader, ClipLoader } from "react-spinners";
import LoadingBarLoader from "@/app/components/shared/LoadingBarLoader";
const page = () => {
  const router = useRouter();
  const { courseId } = useParams();
  const user = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const { fetchCart, cart } = useCartStore();
  const [course, setCourse] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState();
  const [viewLesson, setViewLesson] = useState(false);
  const [viewLessonId, setViewLessonId] = useState("");
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [coursesByInstructor, setCoursesByInstructor] = useState([]);
  const [totalReviewsOfInstructor, setTotalReviewsOfInstructor] = useState(0);
  const [totalCoursesOfInstructor, setTotalCoursesOfInstructor] = useState(0);
  const [totalStudentsEnrolled, setTotalStudentsEnrolled] = useState(0);
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [order, setOrder] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isViewInfo, setIsViewInfo] = useState(false);
  const [chatId, setChatId] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const handleAddReview = async () => {
    if (!rating) return toast.error("Please select a rating");
    setLoading(true);
    const reviewData = {
      // user
      rating: rating,
      comment: comment.trim(),
    };
    try {
      const response = await axios.post(`/api/courses/rate/${courseId}`, {
        reviewData,
      });
      setReviews((prevReviews) => [
        ...(prevReviews || []),
        response.data.newReview,
      ]);
      toast.success("Thanks for your review!");
    } catch (error) {
      console.log("This is the error in this :", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      setReviews(course?.reviews);
    }
  }, [courseId]);

  const fetchCourseFromDB = useCallback(
    async (courseId) => {
      const response = await axios.get(`/api/course/${courseId}`);
      const data = response.data;

      setCourse(data.course);
      setIsLoading(false);
      setTotalReviewsOfInstructor(data?.totalReviews);
      setTotalCoursesOfInstructor(data?.coursesByInstructor.length);
      setCoursesByInstructor(data?.coursesByInstructor);
      setTotalStudentsEnrolled(data?.totalRatings);
      setReviews(data?.reviews);
    },
    [courseId]
  );
  const releatedCourses = useMemo(() => {
    if (!coursesByInstructor || !Array.isArray(coursesByInstructor)) return [];
    return coursesByInstructor.filter((course) => course._id !== courseId);
  }, [coursesByInstructor, courseId]);

  const categoryToSubcategories = {
    academics: ["math", "science", "history"],
    business: ["entrepreneurship", "management", "sales"],
    design: ["ui", "ux", "graphic-design"],
    development: ["web", "mobile", "game"],
    finance: ["investing", "accounting", "crypto"],
    fitness: ["yoga", "cardio", "strength"],
    lifestyle: ["travel", "food", "productivity"],
    marketing: ["seo", "content", "ads"],
    music: ["production", "instrument", "theory"],
    "personal-development": ["mindfulness", "habits", "communication"],
    photography: ["editing", "gear", "composition"],
    productivity: ["time-management", "tools", "automation"],
    technology: ["ai", "cloud", "iot"],
  };

  const formattedDate = useMemo(() => {
    const dateString = course?.updatedAt || course?.createdAt;
    if (!dateString) return "No date available";

    const date = new Date(dateString);
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    return `Last updated on ${month}/${year}`;
  }, [course?.updatedAt, course?.createdAt]);

  const totalCourseDuration = useMemo(() => {
    if (!course || !Array.isArray(course.lessons)) return "0 mins";

    const totalMinutes = course.lessons.reduce((total, lesson) => {
      return total + (lesson.duration || 0);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours} h ${minutes} m` : `${minutes} m`;
  }, [course]);

  const totalMinutesOfLesson = (minutes) => {
    const min = minutes % 60;
    return min > 0 ? `${min} min` : `${Math.floor(minutes / 60)} h`;
  };
  const checkCompletedLesson = async (lessonId) => {
    const response = await axios.get(
      `/api/progress/check/${courseId}/${lessonId}`
    );
    const data = await response.data.progress;
    if (response.data.progress.completedLessons.includes(lessonId)) {
      setIsLessonCompleted(true);
      setCompletedLessons((prev) => [...prev, lessonId]);
    }
    setIsLoading(false);
  };

  // chat inititalization //

  const handleInitializeChat = async () => {
    toast.loading("Initializing chat...");
    try {
      const response = await axios.post("/api/chat", {
        sender: user.id || user._id,
        receiver: course?.instructor?._id,
      });
      const data = response.data.chat;
      setChatId(data?._id);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      toast.dismiss();
      router.push(`/chat`);
    }
  };

  useEffect(() => {
    const checkLessons = async () => {
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

  useEffect(() => {
    if (courseId) {
      const timeout = setTimeout(() => {
        fetchCourseFromDB(courseId);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [courseId]);
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

  const fetchUser = async () => {
    const response = await axios("/api/users/me");
    if (response.data.user) {
      setAuthUser(response.data.user);
    }
  };
  const likeCourse = async () => {
    if (!user) {
      return alert("Please login first");
    }
    // params mai user id pass karni   hai
    try {
      if (!courseId) return alert("Error");
      const reponse = await axios.post(`/api/likeCourse/${courseId}`);
      fetchUser();
      setIsLiked(true);
      toast.success("Course liked! You'll find it in your Liked Courses.");
    } catch (error) {
      throw new error("Error liking course");
    }
  };

  const unlikeCourse = async () => {
    if (!user) {
      return alert("Please login first");
    }
    // params mai user id pass karni   hai
    try {
      if (!courseId) return alert("Error");
      const reponse = await axios.delete(`/api/dislikeCourse/${courseId}`);
      fetchUser();
      setIsLiked(false);
      toast.success("Course Disliked!");
    } catch (error) {
      throw new error("Error liking course");
    }
  };
  function formatRatingNumber(num) {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    } else {
      return num.toString();
    }
  }
  function convertToTotalHours(timeStr) {
    const parts = timeStr.toString().split(":").map(Number);

    let hours = 0;
    if (parts.length === 3) {
      hours = parts[0] + parts[1] / 60 + parts[2] / 3600;
    } else if (parts.length === 2) {
      hours = parts[0] / 60 + parts[1] / 3600;
    } else if (parts.length === 1) {
      hours = parts[0] / 3600;
    }

    return parseFloat(hours.toFixed(2)); // rounded to 2 decimals
  }

  const handleAddToCart = async (courseId) => {
    const toastId = toast.loading("Adding to cart...");
    try {
      const response = await axios.post(`/api/cart/${courseId}`);
      toast.dismiss(toastId);
      fetchCart();
      fetchUser();
      toast.success("Course added to cart");
    } catch (error) {
      console.log(error);
      toast.error(error?.message || "Something went wrong");
      toast.dismiss(toastId);
      throw error;
    }
  };
  const handleRemoveFromCart = async (courseId) => {
    const toastId = toast.loading("Adding to cart...");

    try {
      const response = await axios.delete(`/api/cart/${courseId}`);
      toast.dismiss(toastId);

      toast.success("Course removed from cart");
      fetchCart();
    } catch (error) {
      toast.dismiss(toastId);

      throw error;
    }
  };
  useEffect(() => {
    if (user && user.likedCourses && user?.likedCourses?.includes(courseId)) {
      setIsLiked(true);
    } else {
      setIsLiked(false);
    }
  }, [user, cart]);

  useEffect(() => {
    if (user && course) {
      const isUserEnrolled = user.enrolledCourses?.some(
        (item) => (item?._id || item).toString() === course._id.toString()
      );
      setIsEnrolled(isUserEnrolled);
    }
  }, [user, course]);

  const verifyPayment = async (paymentData) => {
    try {
      console.log("Verifying payment with user:", user);
      console.log("User ID:", user?.id || user?._id);

      const userId = user?.id || user?._id;
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
    } catch (error) {
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
  const handleBuyNow = async () => {
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
        amount: course.price * 100, // Amount in paisa
        currency: "INR",
        name: "Brainnest LMS",
        description: `Purchase: ${course.title}`,
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            toast.loading("Verifying payment...");
            const verification = await verifyPayment(response);

            if (verification.success) {
              toast.success(
                "Payment successful! You now have access to the course."
              );
              setIsPaid(true);
              // Redirect to course page or dashboard
              toast.dismiss();
              router.push(`/courses/${course._id}`);
              fetchUser();
            } else {
              toast.error(
                "Payment verification failed. Please contact support."
              );
              // add verification failure handling here like order failed
              toast.error(verification.data.message);
            }
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
            // add verification failure handling here like order failed
            toast.error(verification.data.message);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || "",
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

      const razor = new window.Razorpay(options);
      razor.open();
      toast.dismiss();

      if (response.data.success) {
        toast.success("Course purchased successfully!");

        // Refresh user data to update enrolled courses
        await fetchUser();

        // Redirect to course view page
      } else {
        toast.error(response.data.message || "Failed to process payment");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Something went wrong");
      alert("Failed to initiate payment. Please try again.");
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

  useEffect(() => {
    // Make sure cart is fetched when component mounts
    if (user) {
      fetchCart();
    }
  }, [user]);

  useEffect(() => {
    if (user && course && user.completedCourses?.includes(course._id)) {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }
  }, [user, course]);
  const checkAlreadyAdded = () => {
    let isInCart = false;
    isInCart = cart.courses?.some(
      (cartCourse) => cartCourse?._id === course?._id
    );
    setIsAlreadyAdded(isInCart);
  };

  const filteredCourseReviews = () => {
    if (!course?.reviews) return [];

    const filteredReviews = course.reviews.filter((item) => item.rating > 3);

    if (course.reviews.length < 5) {
      return course.reviews;
    } else {
      return filteredReviews.slice(0, 9);
    }
  };
  const handleDownloadCertificate = async () => {
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
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };
  useEffect(() => {
    if (user && cart) {
      checkAlreadyAdded();
    }
  }, [user, cart]);
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="relative w-full min-h-screen flex flex-col gap-6  py-18 pt-0 ">
      {isLoading && (
        <div className="w-full relative">
          <LoadingBarLoader isLoading={isLoading} />
        </div>
      )}
      <div className="absolute top-0 left-0 w-full h-1/2 dark:bg-black bg-white z-[-1]" />
      {isLoading ? (
        <div className="w-full flex items-center justify-center ">
          <Skeleton className="!w-[70%] lg:w-[60%] h-[50vh] rounded-lg flex item-center justify-center !pt-6" />
        </div>
      ) : (
        <div className="w-[90%] md:w-[70%] lg:w-[60%] bg-transparent mx-auto flex flex-col justify-start items-center relative">
          <div className="relative w-full h-[300px] overflow-hidden">
            <Image src={course?.coverImage} fill className="rounded-lg" />
          </div>
        </div>
      )}
      <div className="relative w-[90%] md:w-[90%] lg:w-[60%] bg-transparent mx-auto flex flex-col justify-start items-center h-full gap-6 min-h-screen pt-2">
        {isLoading ? (
          <Skeleton className="absolute right-0 top-2 w-[40px] h-[40px] rounded-full !pt-6" />
        ) : (
          !isEnrolled && (
            <div className="absolute right-0 top-2 w-[40px] h-[40px] rounded-full flex items-center justify-center border-1 border-gray-300">
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
                  onClick={() => {
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
        {isLoading ? (
          <Skeleton className="absolute right-0 top-2 w-[40px] h-[40px] rounded-full" />
        ) : (
          isEnrolled && (
            <div
              className="absolute right-0 top-2 w-[40px] h-[40px] rounded-full flex items-center justify-center border-1 border-gray-300"
              onMouseEnter={() => {
                setIsViewInfo(true);
              }}
              onMouseLeave={() => {
                setIsViewInfo(false);
              }}
            >
              <TbMessageUser className="text-2xl relative cursor-pointer" />
              {isViewInfo && (
                <Card className="w-[350px] absolute right-4 bottom-4 z-99 rounded-br-none">
                  <CardHeader>
                    <CardTitle>Chat with Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                    <Button variant="outline">Cancel</Button>
                    <Button
                      onClick={() => {
                        if (!user) {
                          router.push("/login");
                          toast.error("Please login first");
                          return;
                        }
                        handleInitializeChat();
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

        {isLoading ? (
          <Skeleton className="absolute right-0 top-2 w-[40px] h-[40px] rounded-full" />
        ) : (
          !isEnrolled && (
            <div className="absolute right-12 top-2 w-[40px] h-[40px] rounded-full flex items-center justify-center border-1 border-gray-300">
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
        {isLoading ? (
          <Skeleton className="absolute right-0 top-2 w-[40px] h-[40px] rounded-full" />
        ) : (
          <div className="absolute right-33 top-2 w-[40px] h-[40px]  flex items-center justify-center  border-gray-300">
            {!isEnrolled && (
              <Button
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
        {isLoading ? (
          <Skeleton className="absolute right-0 top-2 w-[40px] h-[40px] rounded-full" />
        ) : (
          <div className="absolute right-30 top-2 w-[40px] h-[40px]  flex items-center justify-center  border-gray-300">
            {isCompleted && (
              <Button
                onClick={() => {
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
          <p className="dark:text-white text-black text-2xl sm:text-3xl lg:text-4xl capitalize whitespace-normal break-words line-clamp-3 leading-tight">
            {course?.title}
          </p>
          {Array.isArray(course?.description)?.topic && (
            <p>{course?.description?.topic}</p>
          )}
          {Array.isArray(course?.description)?.description && (
            <p>{course?.description?.description}</p>
          )}
          {isLoading ? (
            <Skeleton className="w-[10px] h-[30px] " />
          ) : (
            <Badge>Bestseller</Badge>
          )}
          {isLoading ? (
            <Skeleton className="w-[10px] h-[30px] " />
          ) : (
            <p className="dark:text-white text-black text-2xl capitalize whitespace-normal break-words line-clamp-2">
              ₹ {Number(course?.price)}
            </p>
          )}
        </div>

        <div className="flex gap-2 w-full   justify-start items-center">
          <span className="flex gap-2  items-center">
            {isLoading ? (
              <Skeleton className="w-[10px] h-[10px] rounded-full" />
            ) : (
              <LuOctagonAlert />
            )}
            {""}
            {isLoading ? (
              <Skeleton className="w-[50px] h-[10px]" />
            ) : (
              <span className="text-sm">{formattedDate}</span>
            )}
          </span>
          <span className="flex gap-2  items-center">
            {isLoading ? (
              <Skeleton className="w-[10px] h-[10px] rounded-full" />
            ) : (
              <IoGlobeOutline />
            )}
            {""}
            {isLoading ? (
              <Skeleton className="w-[50px] h-[10px]" />
            ) : (
              <p>{course?.language}</p>
            )}
          </span>
          <span className="flex gap-2 items-center">
            {isLoading ? (
              <Skeleton className="w-[10px] h-[10px] rounded-full" />
            ) : (
              <LuCaptions />
            )}
            {""}
            {isLoading ? (
              <Skeleton className="w-[50px] h-[10px]" />
            ) : (
              course?.language
            )}
          </span>
        </div>
        <div className="w-full h-[120px] flex flex-row justify-start items-center border-2 border-gray-300 rounded-lg mt-4">
          {isLoading ? (
            <Skeleton className="w-1/5 h-full " />
          ) : (
            <span className="w-1/5 h-full flex justify-center items-center">
              <RiVerifiedBadgeLine className="text-4xl" />
            </span>
          )}

          {isLoading ? (
            <Skeleton className="w-2/5 h-full " />
          ) : (
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
            className="!h-3/5 w-px bg-gray-300 mx-2 hidden sm:block"
          />
          {isLoading ? (
            <Skeleton className="w-1/5 h-full " />
          ) : (
            <span className="w-1/5 hidden  sm:flex flex-col gap-1 justify-center items-center break-words text-center">
              <StarRating rating={course?.rating || 0} />
              <p>{course?.rating || 0} ratings</p>
            </span>
          )}
          <Separator
            orientation="vertical"
            className="!h-3/5 w-px bg-gray-300 mx-2"
          />

          {isLoading ? (
            <Skeleton className="w-2/5 h-full " />
          ) : (
            <span className="w-2/5 sm:w-1/5 flex flex-col gap-1 justify-center items-center break-words text-center">
              <MdOutlinePeopleAlt className="text-2xl" />
              <p>{course?.enrolledStudents?.length || 0} learners</p>
            </span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="w-full min-h-[100px] flex flex-col justify-start items-start border-2 py-2 px-4 mt-4  " />
        ) : (
          <div className="w-full min-h-[100px] flex flex-col justify-start items-start border-2 py-2 px-4 mt-4  ">
            {isLoading ? (
              <Skeleton className={"w-full h-[2px]"} />
            ) : (
              <h3 className="text-2xl font-semibold">What you'll learn</h3>
            )}
            {isLoading ? (
              <Skeleton className="w-full  h-[5px]" />
            ) : (
              <ul className="list-none list-inside dark:text-white text-black  pl-3 py-3 ">
                {Array.isArray(course?.whatYouWillLearn) &&
                  course.whatYouWillLearn.map((item, index) => (
                    <li key={item._id || index}>
                      <TiTick className="inline-block text-green-500 mr-2 text-2xl" />
                      {item || "Untitled Topic"}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
        {isLoading ? (
          <Skeleton className="w-full h-[50px]" />
        ) : (
          <div className="w-full flex flex-col  justify-start items-start ">
            <h3 className="text-2xl font-semibold ">Explore Releated Topics</h3>
            <div className="w-full flex gap-2 mt-4">
              {categoryToSubcategories[course?.category?.name]?.map(
                (subcategory) =>
                  isLoading ? (
                    <Skeleton className="w-[40px] h-[20px]" />
                  ) : (
                    <Link
                      key={subcategory}
                      href={`/courses/${subcategory}`}
                      className=" hover:underline border-2  px-6 py-2 rounded shadow-sm cursor-pointer"
                    >
                      {subcategory}
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
        {isLoading ? (
          <Skeleton className="w-full h-[80px]" />
        ) : (
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            <h3 className="text-2xl font-semibold ">This course includes :</h3>
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-2 mt-4 px-2">
              <span className="w-1/2 h-full flex justify-start  items-center">
                {isLoading ? (
                  <Skeleton className="h-[20px]" />
                ) : (
                  <div className="flex gap-3 min-h-[20px] justify-start items-center">
                    <MdOutlineOndemandVideo className="text-2xl" />
                    <p className="whitespace-pre">
                      : {totalCourseDuration || 0} on demand video
                    </p>
                  </div>
                )}
              </span>
              {isLoading ? (
                <Skeleton className="h-[20px]" />
              ) : (
                <span className="flex gap-3 min-h-[20px] justify-start items-center">
                  <CiTrophy className="text-2xl" />{" "}
                  <p>Certificate of completion</p>
                </span>
              )}
              <span className="w-1/2 h-full flex justify-start  items-center"></span>
            </div>
          </div>
        )}
        {isLoading ? (
          <Skeleton className={"w-full h-[100px] "} />
        ) : (
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            {isLoading ? (
              <Skeleton className="" />
            ) : (
              <h3 className="text-2xl font-semibold ">Course content</h3>
            )}
            <div className="w-full min-h-[50px] flex flex-col gap-2 mt-4 px-2">
              {(course?.lessons || [])?.map((lesson) => {
                return (
                  <div
                    key={lesson?.name}
                    className="w-full flex flex-col justify-between items-center relative"
                  >
                    <div
                      className={`w-full min-h-[70px] justify-between items-center flex border-2 border-gray-300 rounded px-4 ${
                        viewLesson || lesson._id == viewLessonId
                          ? "rounded-b-none"
                          : "rounded"
                      }`}
                    >
                      {isLoading ? (
                        <Skeleton className="w-1/2 h-[25px]" />
                      ) : (
                        <span className="w-1/2 flex justify-start items-center gap-4">
                          {viewLesson ? (
                            <IoIosArrowUp
                              onClick={() => {
                                setViewLesson(false);
                                setViewLessonId("");
                              }}
                              className="cursor-pointer"
                            />
                          ) : (
                            <IoIosArrowDown
                              onClick={() => {
                                setViewLesson(true);
                                setViewLessonId(lesson?._id);
                              }}
                              className="cursor-pointer"
                            />
                          )}{" "}
                          {lesson.name}
                        </span>
                      )}
                      <span className="w-1/2 flex justify-end items-center gap-4">
                        {lesson?.video ? "1" : null} <GoDotFill />
                        <p>{totalMinutesOfLesson(lesson.duration)}</p>
                      </span>
                    </div>
                    {/* put the matching lesson Id here after the view Lesson */}
                    {viewLesson && (
                      <div className="w-full min-h-[100px] border-2 border-t-none flex justify-between px-4">
                        <p className="flex items-center gap-3 ">
                          <MdOutlineOndemandVideo className="text-xl" />{" "}
                          {lesson?.name}
                        </p>{" "}
                        <p className="flex items-center gap-4">
                          {user && (
                            <FaEye
                              className={`${
                                isLessonCompleted
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
                          {totalMinutesOfLesson(lesson.duration)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {isLoading ? (
          <Skeleton className={"w-full h-[100px] "} />
        ) : (
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            {isLoading ? (
              <Skeleton className="" />
            ) : (
              <h3 className="text-2xl font-semibold px-2">Requiremnts</h3>
            )}
            <div className="w-full min-h-[50px] flex flex-col justify-start gap-2 mt-4 px-2">
              <ul>
                {Array.isArray(course?.requirements) &&
                  course.requirements.map((item, index) => (
                    <li
                      key={item._id || index}
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
        {isLoading ? (
          <Skeleton className={"w-full h-[100px] "} />
        ) : (
          <div className="w-full flex flex-col  justify-start items-start mt-4">
            {isLoading ? (
              <Skeleton className="" />
            ) : (
              <h3 className="text-2xl font-semibold px-2">Description</h3>
            )}
            <div className="w-full min-h-[50px] flex flex-col gap-2 mt-4 px-2 ">
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
                      onClick={() => {}}
                      className="cursor-pointer"
                    />
                  ) : (
                    <IoIosArrowDown
                      onClick={() => {}}
                      className="cursor-pointer"
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        {isLoading ? (
          <Skeleton className={"w-full h-[100px] "} />
        ) : (
          course?.reviews > 0 && (
            <div className="w-full flex flex-col  justify-start items-start mt-4">
              <div className="w-full min-h-[50px] flex flex-col gap-2 mt-4 px-2 ">
                <div className="w-full">
                  <div className="mb-4 flex flex-row gap-2 w-full h-full items-start  jsutify-center">
                    <p>Course Reviews</p>{" "}
                    <GoDotFill className="inline-block mx-2 my-auto" />
                    <p className="text-gray-600">
                      {course?.ratings || 0} ratings
                    </p>
                  </div>
                  <div className="grid-cols-6 flex-1">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {course.reviews.length === 0 ? (
                          <CarouselItem>
                            <Skeleton className="w-[280px] h-[300px] rounded-md" />
                          </CarouselItem>
                        ) : (
                          (ranndomCoursesOnRating || []).map(
                            (course, index) => (
                              <CarouselItem
                                key={`${index}-${index}`}
                                className="md:basis-1/3 lg:basis-1/3 xl:basis-1/3 2xl:basis-1/4 gap-3"
                              >
                                <div className=" my-2 relative">
                                  <Link href={`/`}>
                                    <Card className="w-[250px] h-[280px] my-2 relative pt-0 pb-3">
                                      <CardHeader className="w-full h-1/8 flex justify-start items-center relative -mb-4">
                                        <ImQuotesLeft />
                                      </CardHeader>
                                      <CardContent className="min-h-1/5 max-h-2/5 w-full flex justify-center relative ">
                                        <p className="text-sm">
                                          {!course?.reviews ||
                                            "Udemy gives you the ability to be persistent. I learned exactly what I needed to know in the real world. It helped me sell myself to get a new role."}
                                        </p>
                                      </CardContent>
                                      <CardFooter className={"h-2/5"}>
                                        <div className="w-full flex justify-start items-center   gap-2">
                                          <div className="h-full w-1/3 flex flex-col items-center justify-start">
                                            <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-start bg-[#F6F7F9]">
                                              <Image
                                                src={
                                                  course?.reviews[0]?.user
                                                    ?.profileImage ||
                                                  "https://img-c.udemycdn.com/user/100x100/12345678.jpg"
                                                }
                                                alt={course.title}
                                                fill
                                                className="object-cover rounded-full"
                                              />
                                            </div>
                                          </div>
                                          <div className="h-full flex flex-col  w-2/3">
                                            <p className="capitalize text-sm font-semibold break-words leading-snug">
                                              {course.reviews?.user?.name ||
                                                "John Doe"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {course?.reveiews?.createdAt ||
                                                course?.reveiews?.updatedAt ||
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
                      <CarouselPrevious />
                      <CarouselNext className={"ml-4"} />
                    </Carousel>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        {isLoading ? (
          <Skeleton className={"w-full h-[100px] "} />
        ) : (
          <div className="w-full flex flex-col  justify-between items-start mt-4">
            {isLoading ? (
              <Skeleton className="" />
            ) : (
              <h3 className="text-2xl font-semibold px-2">Instructor</h3>
            )}
            <div className="w-full min-h-[50px] flex flex-row justify-between items-center gap-2 mt-4 px-2">
              <div className="w-1/6 ">
                <div className="w-[60px] h-[60px] max-w-[100px] rounded-full relative ">
                  <Image
                    src={course?.instructor?.profileImage || <CircleUser />}
                    alt={course.title}
                    fill
                    className="object-cover rounded-full "
                  />
                </div>
              </div>
              <p className="text-lg font-semibold w-2/5 flex items-center">
                {course?.instructor?.name}
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
        {isLoading ? (
          <Skeleton className={"w-full h-[100px] "} />
        ) : (
          <div className="w-full flex flex-col  justify-between items-start mt-8 px-2">
            <div className="w-full">
              <div className="mb-4 flex flex-col gap-2 w-full h-full">
                <h2 className="text-2xl font-semibold ">
                  Explore other courses by {course?.instructor?.name}{" "}
                </h2>
              </div>
              <div className="grid-cols-6 flex-1">
                <Carousel className="w-full">
                  <CarouselContent>
                    {releatedCourses.length === 0 ? (
                      <CarouselItem>
                        <Skeleton className="w-[280px] h-[350px] rounded-md" />
                      </CarouselItem>
                    ) : (
                      (releatedCourses || []).map((course, index) => (
                        <CarouselItem
                          key={`${index}-${index}`}
                          className="md:basis-1/3 lg:basis-1/3 xl:basis-1/3 2xl:basis-1/3 gap-3"
                        >
                          <div className=" my-2 relative">
                            <Link href={`/courses/${course._id}`}>
                              <Card className="w-[250px] h-[300px] my-2 relative pt-0 pb-3">
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
                                    <Skeleton className="w-full h-[200px]" />
                                  )}
                                </CardContent>
                                <CardFooter className={"flex-1"}>
                                  <div className="w-full flex flex-col flex-1 items-start justify-center gap-2">
                                    <p className="capitalize text-lg font-semibold break-words leading-snug">
                                      {course.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {course?.category?.name
                                        .charAt(0)
                                        .toUpperCase() +
                                        course?.category?.name.slice(1)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      ₹{parseInt(course?.price)}
                                    </p>
                                    <div className="flex gap-2">
                                      <Badge variant="outline ">
                                        {course?.rating &&
                                          formatRatingNumber(course.rating)}
                                      </Badge>
                                      <Badge variant="outline flex gap-2">
                                        {course?.duration &&
                                          convertToTotalHours(
                                            course.duration
                                          )}{" "}
                                        hours
                                      </Badge>
                                      <Badge variant="outline flex gap-2">
                                        {course?.category?.subCategories[0]}
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
                  <CarouselPrevious />
                  <CarouselNext className={"ml-4"} />
                </Carousel>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <Skeleton className={"w-full h-[100px] "} />
        ) : (
          <div className="w-full flex flex-col  justify-between items-start mt-8 px-2">
            <div className="w-full ">
              <div className="mb-4 flex flex-col gap-2 w-full h-full">
                <h2 className="text-2xl font-semibold ">Add your review</h2>
              </div>
              <div className="grid-cols-6 flex-1">
                <div className="">
                  <Textarea
                    placeholder="Type your review here."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="flex flex-col items-start gap-2 mt-3">
                  <div className="w-full flex justify-center items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, index) => {
                        const currentRating = index + 1;
                        return (
                          <label key={index}>
                            <input
                              type="radio"
                              name="rating"
                              value={currentRating}
                              onClick={() => setRating(currentRating)}
                              className="hidden"
                            />
                            <FaStar
                              size={28}
                              className={`cursor-pointer transition-colors ${
                                currentRating <= (hover || rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              onMouseEnter={() => setHover(currentRating)}
                              onMouseLeave={() => setHover(null)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
                    onClick={handleAddReview}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-md" />
        ) : (
          <div className="w-full">
            <div className="mb-4 flex flex-col gap-2 w-full h-full">
              <h2 className="text-3xl font-bold ">
                See what others are achieving through learning{" "}
              </h2>
              <p className="text-gray-600">
                Know the achievers of the world through their stories
              </p>
            </div>
            <div className="grid-cols-6 flex-1">
              <Carousel className="w-full">
                <CarouselContent>
                  {course?.reviews.length === 0 ? (
                    <CarouselItem>
                      <Skeleton className="w-[280px] h-[300px] rounded-md" />
                    </CarouselItem>
                  ) : (
                    (filteredCourseReviews() || []).map((review, index) => (
                      <CarouselItem
                        key={`${index}-${index}`}
                        className="md:basis-1/3 lg:basis-1/3 xl:basis-1/3 2xl:basis-1/4 gap-3"
                      >
                        <div className=" my-2 relative">
                          <Link href={`/`}>
                            <Card className="w-[250px] h-[280px] my-2 relative pt-0 pb-3">
                              <CardHeader className="w-full h-1/8 flex justify-start items-center relative -mb-4">
                                <ImQuotesLeft />
                              </CardHeader>
                              <CardContent className="min-h-2/5 max-h-2/5 w-full flex justify-center relative overflow-hidden">
                                <p className="text-sm text-center">
                                  {review?.comment ||
                                    "Udemy gives you the ability to be persistent. I learned exactly what I needed to know in the real world. It helped me sell myself to get a new role."}
                                </p>
                              </CardContent>
                              <CardFooter className={"h-2/5"}>
                                <div className="w-full flex justify-start items-center   gap-2">
                                  <div className="h-full w-1/3 flex flex-col items-center justify-start">
                                    <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-start bg-[#F6F7F9]">
                                      <Image
                                        src={
                                          review?.user?.profileImage ||
                                          "https://img-c.udemycdn.com/user/100x100/12345678.jpg"
                                        }
                                        alt={review?.user?.name}
                                        fill
                                        className="object-cover rounded-full"
                                      />
                                    </div>
                                  </div>
                                  <div className="h-full flex flex-col  w-2/3">
                                    <p className="capitalize text-sm font-semibold break-words leading-snug">
                                      {review?.user?.name || "John Doe"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {review?.createdAt
                                        ? new Date(
                                            review.createdAt
                                          ).toLocaleDateString("en-GB")
                                        : review?.updatedAt
                                        ? new Date(
                                            review.updatedAt
                                          ).toLocaleDateString("en-GB")
                                        : "2 days ago"}
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
                <CarouselPrevious />
                <CarouselNext className={"ml-4"} />
              </Carousel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
