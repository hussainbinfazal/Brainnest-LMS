"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef ,useCallback } from "react";
import { useCourseStore } from "@/lib/store/useCourseStore";
import axios from "axios";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Render a YouTube video player
const page = () => {
  const router = useRouter();
  const courses = useCourseStore((state) => state.courses);
  const [isLoading, setIsLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [course, setCourse] = useState(null);
  const { courseId, lessonId } = useParams();
  const playerRef = useRef();
  const fetchCourseFromDB = useCallback(async (courseId) => {
    try {
      const response = await axios.get(`/api/course/${courseId}`);
      const data = await response.data.course;

      if (!data) {
        return;
      }
      setCourse(data);
      const lesson = data.lessons.find((lesson) => lesson._id === lessonId);
      if (lesson) {
        setVideo(lesson.video);
      } else {
        console.warn("Lesson not found!");
      }
      console.log(
        "This is the course that was fetched from the database",
        data
      );
      console.log("This is the course in the course", course);
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setIsLoading(false);
    }
  },[courseId,lessonId]);
  const handleCompleteLesson = async (lessonId) => {
    try {
      await axios.post(`/api/progress/complete/${courseId}/${lessonId}`);
      toast.success("congrats ,you've completed the lesson!");
      router.back();
    } catch (error) {
      console.error("Error marking lesson complete:", error);
    }

    // Refresh progress or update local state
  };

   useEffect(() => {
      const timer = setTimeout(() => {
        fetchCourseFromDB(courseId);
      }, 300); // Small delay to prevent immediate load
      return () => clearTimeout(timer);
    }, [fetchCourseFromDB, courseId]);
  
  useEffect(() => {
    console.log("Course in the course State", course);
  }, [course]);

  useEffect(() => {
    console.log("video :", video);
  }, [video]);
  return (
    <div className="h-screen flex items-center justify-center flex-col bg-black">
      <div
        className="max-w-[70%] w-[70%] flex justify-center items-start
      "
      >
        <div className="w-full flex flex-col gap-4 items-center justify-center">
          <ReactPlayer
            ref={playerRef}
            url={video}
            onEnded={() => handleCompleteLesson(lessonId)}
            controls
            playIcon
            volume={0.8}
            config={{
              file: {
                attributes: {
                  controlsList: "nodownload", // disables download button
                  disablePictureInPicture: true,
                },
              },
            }}
          />
          <div className="flex flex-col items-center min-h-[100px] justify-between w-full">
            <Button
              variant="outline"
              onClick={() => playerRef.current?.getInternalPlayer().play()}
              className="px-6 py-2 rounded-sm"
            >
              Play
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="px-6 py-2 rounded-sm"
            >
              Back to course page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
