"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCourseStore } from "@/lib/store/useCourseStore";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { IoSearch } from "react-icons/io5";
import { LuEyeClosed } from "react-icons/lu";
import { PiEyes } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { CiEdit } from "react-icons/ci";
import axios from "axios";
import { toast } from "sonner";
import { validateEmail, validatePhoneNumber } from "@/utils/validators";
import {
  Card,
  CardContent,
  CardFooter,
 
} from "@/components/ui/card";
import LoadingBarLoader from "../components/shared/LoadingBarLoader";

const page = () => {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const { fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [pendingCourses, setPendingCourses] = useState(0);
  const [pendingLessons, setPendingLessons] = useState(0);
  const [viewPassword, setViewPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { courses } = useCourseStore((state) => state);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const userId = authUser?._id || authUser?.id;
  const completedCourseOfUser = () => {
    // Use the completedCourses field directly from user data
    const completedCoursesCount = authUser?.completedCourses?.length || 0;
    const enrolledCoursesCount = authUser?.enrolledCourses?.length || 0;
    const pendingCoursesCount = enrolledCoursesCount - completedCoursesCount;
    
    setCompletedCourses(completedCoursesCount);
    setPendingCourses(pendingCoursesCount);
    
    // For lessons, we still need to check the courses if available
    if (courses.length > 0) {
      let completedLessons = 0;
      let pendingLessons = 0;
      
      courses.forEach((course) => {
        const isEnrolled = authUser?.enrolledCourses?.some(
          (enrolledId) => enrolledId.toString() === course._id.toString()
        );
        if (!isEnrolled) return;
        
        course.lessons?.forEach((lesson) => {
          if (lesson.status === "completed") {
            completedLessons++;
          } else {
            pendingLessons++;
          }
        });
      });
      
      setCompletedLessons(completedLessons);
      setPendingLessons(pendingLessons);
    }
  };

  const filteredCourses =
    searchTerm.trim() === ""
      ? authUser?.enrolledCourses
      : courses.filter((course) => {
          const title = course.title?.toLowerCase() || "";
          const instructorName = course.instructor?.name?.toLowerCase() || "";
          const term = searchTerm.toLowerCase();

          return title.includes(term) || instructorName.includes(term);
        });
  const lessonProgress = (course) => {
    const totalLessons = course.lessons.length;
    const completedLessons = course.lessons.filter(
      (lesson) => lesson.status === "completed"
    ).length;
    const progressPercentage = (completedLessons / totalLessons) * 100;
    return progressPercentage.toFixed(2);
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

  const sendEmail = async () => {
    try {
      const response = await axios.post("/api/users/sendEmail", {
        email: authUser?.email,
        userId: userId,
        emailType: "RESET",
      });
      toast.success("Email sent successfully!");
    } catch (error) {
      console.log(error?.response?.data?.message);
      throw error;
    }
  };
  const handleUpdateUserInfo = async () => {
    const emailError = validateEmail(email);
    const phoneError = validatePhoneNumber(phoneNumber);

    if (emailError || phoneError) {
      toast.error(emailError || phoneError); // Show the error message to the user
      return;
    }
    try {
      const userData = {
        phoneNumber: phoneNumber,
        email,
        password:password,
        name,
      };
      const response = await axios.put(`/api/users/${userId}`, { userData });
      const data = await response.data;
      // console.log("Updated Data", data);
      fetchUser();
      toast.success("Profile updated successfully");
    } catch (error) {
      throw error;
    }
  };
  useEffect(() => {
    if (authUser) {
      console.log('AuthUser in useEffect:', authUser);
      completedCourseOfUser();
      setLoading(false);
      setName(authUser?.name || "");
      setEmail(authUser?.email || "");
      setPhoneNumber(authUser?.phoneNumber || "");
      setPassword(authUser?.password || "");
    }
  }, [authUser, courses]);
  
  useEffect(() => {
    // Fetch full user data when component mounts
    if (!authUser) {
      fetchUser();
      console.log('Fetching user data...');
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
      return () => clearTimeout(timer);
    },350)
    
  }, []);
  return (
    <div className="min-h-screen w-full flex flex-col justify-start items-center gap-4 py-6 relative pt-1">
      {loading && (
              <div className="w-full relative">
                <LoadingBarLoader isLoading={loading} />
              </div>
            )}
      <div className=" w-[90%] md:w-[70%] flex flex-col justify-center items-start gap-8">
        <div className="flex flex-col justify-center items-center w-full gap-5">
          {loading ? (
            <Skeleton className="h-12 w-12 rounded-full " />
          ) : (
            <Avatar>
              <AvatarImage
                src={
                  authUser?.profileImage ||
                  "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pngegg.com%2Fen%2Fsearch%3Fq%3Duser&psig=AOvVaw2P4P0zPWzOw15eH5ERDVkS&ust=1747783870511000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCOidmrzYsI0DFQAAAAAdAAAAABAL"
                }
              />
              <AvatarFallback>
                {authUser?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <span>
            {loading ? <Skeleton className="h-4 w-30" /> : authUser?.name}
          </span>
          {authUser?.role === "instructor" && (
            <span className="text-sm cursor-pointer">
              {loading ? (
                <Skeleton className="h-4 w-30" />
              ) : (
                (authUser?.role).charAt(0).toUpperCase() +
                (authUser?.role).slice(1)
              )}
            </span>
          )}
          <span
            className="cursor-pointer text-sm "
            onClick={() => {
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </span>
        </div>
        <div className="w-full flex justify-center items-center">
          <span className="flex flex-col justify-center items-center w-auto p-6 h-full">
            <span className="text-2xl font-semibold">
              {loading ? (
                <Skeleton className="h-4 w-10" />
              ) : (
                authUser?.enrolledCourses?.length || 0
              )}
            </span>
            <span className="text-sm">
              {loading ? <Skeleton className="h-4 w-8" /> : "courses"}
            </span>
          </span>
          <Separator orientation="vertical" className="!h-[25px]  !w-[2px]" />
          <span className="flex flex-col justify-center items-center w-auto p-6 h-full">
            <span className="text-2xl font-semibold">
              {loading ? <Skeleton className="h-4 w-10" /> : completedCourses}
            </span>
            <span className="text-sm">
              {loading ? <Skeleton className="h-4 w-8" /> : "completed"}
            </span>
          </span>
          <Separator orientation="vertical" className="!h-[25px]  !w-[2px]" />
          <span className="flex flex-col justify-center items-center w-auto p-6 h-full">
            <span className="text-2xl font-semibold">
              {loading ? <Skeleton className="h-4 w-10" /> : pendingLessons}
            </span>
            <span className="text-sm">
              {loading ? <Skeleton className="h-4 w-8" /> : "pending lessons"}
            </span>
          </span>
          <Separator orientation="vertical" className="!h-[25px]  !w-[2px]" />
          <span className="flex flex-col justify-center items-center w-auto p-6 h-full">
            <span className="text-2xl font-semibold">
              {loading ? <Skeleton className="h-4 w-10" /> : pendingCourses}
            </span>
            <span className="text-sm">
              {loading ? <Skeleton className="h-4 w-8" /> : "pending courses"}
            </span>
          </span>
        </div>
        <div className="w-full grid grid-cols-2 gap-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            minLength={5}
            maxLength={50}
            disabled={!isEditing}
          />
          <Input
            type="name"
            placeholder="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            minLength={5}
            maxLength={50}
            disabled={!isEditing}
          />
          <div className="w-full flex flex-col justify-between items-start">
            <span className="flex w-full justify-between items-center gap-3 pr-3">
              <Input
                type={viewPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                minLength={5}
                maxLength={50}
                disabled={!isEditing}
              />
              {viewPassword ? (
                <PiEyes onClick={() => setViewPassword(!viewPassword)} />
              ) : (
                <LuEyeClosed onClick={() => setViewPassword(!viewPassword)} />
              )}
            </span>
            {isEditing && (
              <span>
                <p
                  className="text-[8px] ml-1 cursor-pointer"
                  onClick={() => {
                    sendEmail();
                  }}
                >
                  Change Password
                </p>
              </span>
            )}
          </div>

          <Input
            type="phoneNumber"
            placeholder="Phone Number"
            minLength={5}
            maxLength={50}
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
            }}
            disabled={!isEditing}
          />
        </div>
        {isEditing && (
          <div className="w-full flex justify-center items-center">
            <Button
              onClick={() => {
                handleUpdateUserInfo();
              }}
            >
              Update
            </Button>
          </div>
        )}
        <div className="w-full flex flex-col justify-center items-center  gap-6">
          <span className="w-full flex justify-between items-center">
            <span className="inline-block text-3xl">My Courses</span>
            <span className="relative">
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
          <div className="w-full ">
            {filteredCourses?.length == 0 ? (<div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-lg">
                    {searchTerm.trim() === ""
                      ? "No course found yet."
                      : `No course found for "${searchTerm}"`}
                  </p>
                </div>) : 
                
                (<div className="w-full grid grid-cols-3 gap-3">{(filteredCourses || []).map((course) => (
              <Link
                key={course._id}
                href={`/courses/${course._id}`}
                className="inline-block"
              >
                <Card
                  key={course._id}
                  className="w-full h-[280px] my-2 relative pt-0 pb-3 rounded-sm"
                >
                  <CardContent className="h-3/5 max-h-3/5 w-full flex justify-center relative p-0">
                    {course?.coverImage ? (
                      <>
                        <div className="relative w-full h-full  rounded-t-sm  overflow-hidden">
                          <Image
                            src={course.coverImage}
                            alt={course.title}
                            fill
                            className="object-cover p-0 z-6"
                          />
                        </div>
                        <div className="absolute -bottom-1 left-0 w-full z-0">
                          <Progress
                            value={lessonProgress(course)}
                            className="rounded-none bg-green-500 "
                          />
                        </div>
                      </>
                    ) : (
                      <Skeleton className="w-full h-[150px]" />
                    )}
                  </CardContent>
                  <CardFooter className={"h-2/5 z-7"}>
                    <div className="w-full flex flex-col flex-1 items-start justify-center gap-2">
                      <p className="capitalize text-lg font-semibold break-words leading-snug">
                        {course.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course?.instructor?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ₹{parseInt(course?.price)}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline ">
                          {course?.rating && formatRatingNumber(course.rating)}
                        </Badge>
                        <Badge variant="outline flex gap-2">
                          {course?.duration &&
                            convertToTotalHours(course.duration)}{" "}
                          hours
                        </Badge>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
