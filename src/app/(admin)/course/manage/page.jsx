"use client";
import axios from "axios";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import React from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, useSpring, useScroll } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { IoSearch } from "react-icons/io5";
import { PiChatCircleDotsLight } from "react-icons/pi";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import LoadingBarLoader from "@/app/components/shared/LoadingBarLoader";

const page = () => {
  
  const [courses, setCourses] = useState([]);
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const clearAuthUser = useAuthStore((state) => state.clearAuthUser);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const getMyCourses = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/course/allCourses");
      setCourses(
        (prevCourses) => [...prevCourses, ...response.data.courses] || []
      );
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      getMyCourses();
    }, 300); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [getMyCourses]);
  const updateUserToInstructor = useCallback(async () => {
    try {
      const userId = authUser._id || authUser.id;

      const responseFromUpdateUser = await axios.put(
        `/api/users/update/updateToInstructor/${userId}`
      );

      const response = await axios.get("/api/users/me");
      responseFromUpdateUser();
      // Update store with fresh user
      const { user } = response.data;
      setAuthUser(user);
      toast.success("Welcome to the teaching team at Brainnest.");
    } catch (error) {
    }
  }, [authUser]);
  const handleDeleteCourse = async (courseId) => {
    try {
      const response = await axios.delete(`/api/admin/course/${courseId}`);
      toast.success("Course deleted successfully");
      getMyCourses();
    } catch (error) {
    }
  };

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
  function formatRatingNumber(num) {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    } else {
      return num.toString();
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUserToInstructor();
    }, 300); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [updateUserToInstructor]);
  const filteredCourses =
    searchTerm.trim() === ""
      ? courses
      : courses.filter((course) => {
          const title = course.title?.toLowerCase() || "";
          const instructorName = course.instructor?.name?.toLowerCase() || "";
          const term = searchTerm.toLowerCase();

          return title.includes(term) || instructorName.includes(term);
        });

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
                <Button
                  className={"text-white dark:text-black rounded-full "}
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.5 }}
                  transiton={{ duration: 0.3 }}
                >
                  <PiChatCircleDotsLight className="text-3xl" />
                </Button>
              </motion.span>
            </Link>
            <Link href={"/course/manage/courseStats"}>
              <motion.span>
                <Button
                  className={"text-white dark:text-black rounded-sm "}
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.5 }}
                  transiton={{ duration: 0.3 }}
                >
                  Dashboard
                </Button>
              </motion.span>
            </Link>
            <Link href={"/course/create"}>
              <motion.span>
                <Button
                  className={"text-white dark:text-black rounded-sm "}
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.5 }}
                  transiton={{ duration: 0.3 }}
                >
                  Create Course
                </Button>
              </motion.span>
            </Link>
            <Link href={"/course/coupon"}>
              <motion.span>
                <Button
                  className={"text-white dark:text-black rounded-sm "}
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.5 }}
                  transiton={{ duration: 0.3 }}
                >
                  Manage Coupon
                </Button>
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IoSearch className="absolute top-2 right-2" />
          </span>
        </span>
        <div className="flex flex-col w-full justify-center sm:justify-start">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full mt-4 justify-items-center">
              {Array.from({ length: courses.length || 3 }).map((_, index) => (
                <Card key={index} className="w-[300px] h-[400px] p-4 space-y-4 ">
                  <Skeleton className="h-[200px] w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-10 w-[80px]" />
                    <Skeleton className="h-10 w-[80px]" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 justify-items-center gap-4 w-full mt-4">
              {filteredCourses.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-lg">
                    {searchTerm.trim() === ""
                      ? "No course found yet."
                      : `No course found for "${searchTerm}"`}
                  </p>
                </div>
              ) : (
                filteredCourses.map((course) => {
                  return (
                    <div key={course._id} className="pl-4 ">
                      <div>
                        <Card
                          key={course._id}
                          className="w-[400px] sm:w-[320px] h-[350px] my-2 relative"
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
                              <Skeleton className="w-full h-[200px]" />
                            )}
                          </CardContent>
                          <CardFooter className={"flex-1"}>
                            <div className="w-full flex flex-col flex-1 gap-2">
                              <p className="capitalize text-xl font-semibold break-words leading-snug">
                                {course.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {course?.instructor?.name}
                              </p>
                              <div className="flex gap-2">
                                <Badge variant="outline">
                                  {course?.rating &&
                                    formatRatingNumber(course.rating)}
                                </Badge>
                                <Badge variant="outline flex gap-2">
                                  <>
                                    {course?.duration &&
                                      convertToTotalHours(course.duration)}
                                  </>{" "}
                                  hours
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center w-full  mt-4">
                                <Button
                                  variant="destructive"
                                  className=" p-6 px-10 rounded-sm"
                                  onClick={() => handleDeleteCourse(course._id)}
                                >
                                  Delete
                                </Button>
                                <Button
                                  onClick={() =>
                                    router.push(`/course/edit/${course._id}`)
                                  }
                                  className="p-6 px-10 mr-2 rounded-sm"
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

export default page;
