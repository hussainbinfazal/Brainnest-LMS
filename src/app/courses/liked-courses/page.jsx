"use client";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import axios from "axios";
import { LiaShoppingCartSolid } from "react-icons/lia";
import { MdDelete } from "react-icons/md";
import { motion, useScroll, useTransform } from "framer-motion";
import { FcLike } from "react-icons/fc";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useCourseStore } from "@/lib/store/useCourseStore";
const page = () => {
  const [likedCourses, setLikedCourses] = useState([]);
  const user = useAuthStore((state) => state.authUser);
 const courses = useCourseStore((state) => state.courses);
  const [loading, setLoading] = useState(true);
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
  const router = useRouter();
  // useEffect(() => {
  //   setLikedCourses(cart?.likedCourses);
  // }, []);

  const handleFetchedLikedCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/course/likedCourse");
      const data = response.data;
      setLikedCourses(data);
    } catch (error) {
      throw new Error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  },[user,likedCourses.length]);
  const handleDeleteCourseFromLiked = async (courseId) => {
    try {
      const response = await axios.delete(
        `/api/course/dislikeCourse/${courseId}`
      );
      const UpdatedCourses = likedCourses.filter(
        (item) => item._id !== courseId
      );
      toast.success("Course removed from liked");

      setLikedCourses(UpdatedCourses);
    } catch (error) {
      throw new Error(error?.response?.data?.message);
    }
  };

  const addToCart = (courseId) => {
    try {
      const response = axios.post("/api/cart", { courseId });
      toast.success("Course added to cart");
    } catch (error) {
      return toast.error(error?.response?.data?.message);
    }
    router.push("/checkout");
  };

  useEffect(() => {
    if (user ) {
      handleFetchedLikedCourses();
    }
  }, [user]);
  return (
    <div className="min-h-screen w-screen flex flex-col overflow-auto px-4">
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
                  {(likedCourses || []).map((course) => {
                    return (
                      <div
                        key={course._id}
                        className="inline-block"
                      >
                        <div className="inline-block">
                          <Card className=" h-[400px] w-[300px]">
                            <CardContent className="">
                              <div className="grid w-full items-center gap-2">
                                <div className="flex flex-col space-y-1.5 w-[250px] h-[160px] relative">
                                  <Image
                                    src={course?.coverImage} // image path or URL
                                    alt="Description of the image"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                  <h2 className="text-xl font-semibold  break-words leading-snug">
                                    {course?.title}
                                  </h2>
                                  <p className="text-sm text-muted-foreground">
                                    ({parseInt(course?.rating)})
                                  </p>
                                </div>
                                <div className="flex flex-col space-y-1.5 justify-start items-start gap-1">
                                  <h2 className="text-sm font-semibold text-muted-foreground">
                                    {course?.instructor?.name}
                                  </h2>
                                  <p className="text-2xl text-muted-foreground">
                                    ₹ {course?.price}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleDeleteCourseFromLiked(course._id)
                                }
                                className="px-10"
                              >
                                <span className="w-full flex justify-center">
                                  <RiDeleteBin6Line />
                                </span>
                              </Button>
                              <Button
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
        {likedCourses.length > 0 && (
          <div className="flex justify-end mt-8 ">
            <Button
              onClick={() => {
                addToCart();
              }}
              className="h-15 w-50 rounded-none"
            >
              Add to Cart
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
