"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const courseId = "682ba5c583be348e3f2ea50e";
  
  const fetchMyCourses = async () => {
    try {
      // console.log("fetch my courses called with axios");

      const response = await axios.get("/api/courses/mycourses");
      const data = response.data;
      setCourses(data);
      // console.log("This is the response from the api", response);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const pushIdToEnrolledCourse = async () => {
    try {
      const response = await axios.put(`/api/enrolledstudents/${courseId}`);
      toast.success("Course Enrolled Successfully");
    } catch (error) {
      console.log(error || error.response?.data?.message);
      throw error;
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

  const lessonProgress = (course) => {
    const totalLessons = course.lessons.length;
    const completedLessons = course.lessons.filter(
      (lesson) => lesson.status === "completed"
    ).length;
    const progressPercentage = (completedLessons / totalLessons) * 100;
    return progressPercentage.toFixed(2);
  };
  useEffect(() => {
    fetchMyCourses();
    
  }, []);
  return (
    <div className="min-h-screen w-full flex flex-col justify-start items-center gap-7 py-5">
      <div className="w-[70%] h-full flex flex-col items-start justify-start gap-4 py-5">
        <div className="text-4xl font-bold  flex justify-start items-center">
          My Courses
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  justify-items-start gap-3">
          {loading ? (
            <>
              <Skeleton className="w-[300px] h-[400px]" />
              <Skeleton className="w-[300px] h-[400px]" />
              <Skeleton className="w-[300px] h-[400px]" />
              <Skeleton className="w-[300px] h-[400px]" />
              <Skeleton className="w-[300px] h-[400px]" />
              <Skeleton className="w-[300px] h-[400px]" />
            </>
          ) : (courses || []).length == 0 ? (
            <div>
              <h1 className="text-2xl font-bold">No Course Found</h1>
            </div>
          ) : (
            (courses || []).map((course) => (
              <Link key={course._id} href={`/courses/${course._id}`} className="inline-block">
                <Card key={course._id} className="w-[250px] h-[350px] my-2 relative pt-0 pb-3">
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
                          <Progress value={lessonProgress(course)} className="rounded-none" />
                        </div>
                      </>
                    ) : (
                      <Skeleton className="w-full h-[200px]" />
                    )}
                  </CardContent>
                  <CardFooter className={"flex-1 z-7"}>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
