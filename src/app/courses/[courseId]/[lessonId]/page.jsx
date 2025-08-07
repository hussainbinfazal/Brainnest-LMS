"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef ,useCallback } from "react";
import { useCourseStore } from "@/lib/store/useCourseStore";
import axios from "axios";
import VideoPlayer from "@/components/VideoPlayer";
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
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
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
        setCurrentLesson(lesson);
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
      toast.success("Congrats, you've completed the lesson!");
      router.back();
    } catch (error) {
      console.error("Error marking lesson complete:", error);
    }
  };

  const handleProgress = (progressPercent) => {
    const validProgress = isNaN(progressPercent) ? 0 : progressPercent;
    setProgress(validProgress);
  };

  const handleTimeUpdate = (currentTime, duration) => {
    const validCurrentTime = isNaN(currentTime) ? 0 : currentTime;
    const validDuration = isNaN(duration) ? 0 : duration;
    
    setWatchTime(validCurrentTime);
    
    // Calculate progress percentage
    if (validDuration > 0) {
      const progressPercent = (validCurrentTime / validDuration) * 100;
      setProgress(isNaN(progressPercent) ? 0 : progressPercent);
    }
    
    // Auto-save progress every 10 seconds
    if (Math.floor(validCurrentTime) % 10 === 0 && validDuration > 0) {
      saveProgress(validCurrentTime, validDuration);
    }
  };

  const saveProgress = async (currentTime, duration) => {
    // Progress saving disabled - API endpoint not implemented
    if (duration > 0 && !isNaN(currentTime) && !isNaN(duration)) {
      const progressPercent = ((currentTime / duration) * 100).toFixed(1);
      console.log(`Progress: ${progressPercent}%`);
    }
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
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading lesson...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Lesson Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 text-white border-gray-600 hover:bg-gray-800"
          >
            ← Back to Course
          </Button>
          <h1 className="text-2xl font-bold text-white mb-2">
            {currentLesson?.name || 'Video Lesson'}
          </h1>
          <p className="text-gray-400">
            {course?.title} - Lesson {currentLesson?.order || ''}
          </p>
        </div>

        {/* Video Player */}
        <div className="mb-8">
          {video ? (
            <VideoPlayer
              src={video}
              title={currentLesson?.name}
              poster={course?.coverImage}
              onProgress={handleProgress}
              onTimeUpdate={handleTimeUpdate}
              onComplete={() => handleCompleteLesson(lessonId)}
              playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 2]}
              analytics={true}
              watermark={{
                text: "Brainnest LMS",
                position: "bottom-right"
              }}
              className="w-full"
            />
          ) : (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <p className="text-white text-lg">No video available for this lesson</p>
              <p className="text-gray-400 text-sm mt-2">Please contact support if this is an error</p>
            </div>
          )}
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Watch Progress</h3>
            <div className="bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress || 0}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm">{Math.round(progress || 0)}% completed</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Watch Time</h3>
            <p className="text-2xl font-bold text-white">
              {Math.floor((watchTime || 0) / 60)}:{(Math.floor((watchTime || 0) % 60)).toString().padStart(2, '0')}
            </p>
            <p className="text-gray-400 text-sm">minutes watched</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Lesson Status</h3>
            <p className="text-lg font-semibold text-yellow-400">
              {(progress || 0) >= 90 ? '✅ Completed' : '📚 In Progress'}
            </p>
            <p className="text-gray-400 text-sm">
              {(progress || 0) >= 90 ? 'Well done!' : 'Keep watching'}
            </p>
          </div>
        </div>

        {/* Lesson Description */}
        {currentLesson?.description && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-white font-semibold mb-3">About this lesson</h3>
            <p className="text-gray-300 leading-relaxed">
              {currentLesson.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
