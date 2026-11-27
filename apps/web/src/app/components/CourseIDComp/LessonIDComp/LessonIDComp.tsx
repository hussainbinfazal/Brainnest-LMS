"use client";

import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useCourseStore } from "@/lib/store/usersStore/useCourseStore";
import axios from "axios";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CCourse, CLesson, CLessonProgress } from "@/types/client";
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Router } from "lucide-react";

const SAVE_EVERY_SECONDS: number = 10
// Render a YouTube video player
export const LeesonIdPageComp = ({
  renderedCourse,
  renderedLessons,
  lesson,
  lessonProgress,
  className,
}: {
  renderedCourse: CCourse;
  renderedLessons: CLesson[];
  lesson: CLesson;
  lessonProgress: CLessonProgress;
  className?: string;
}): React.JSX.Element => {
  const router = useRouter();
  // const course = renderedCourse ?? useCourseStore((state) => state.courses);
  const { data: session, status } = useSession()
  const { courseId, lessonId } = useParams<{ courseId: string, lessonId: string }>()
  const [progressSeconds, setProgressSeconds] = useState<number>(lessonProgress.lastPositionSeconds);
  const [progressPercent, setProgressPercent] = useState<number>(lessonProgress.progressPercentage)
  const [lessons, setLessons] = useState<CLesson[]>(renderedLessons)
  const [userLessonProgress, setLessonProgress] = useState<CLessonProgress | null>(lessonProgress)
  const lastSavedAtRef = useRef<number>(lessonProgress?.lastPositionSeconds ?? 0);
  const [watchTime, setWatchTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [video, setVideo] = useState<string | null>(lesson.videoUrl);
  const [course, setCourse] = useState<CCourse>(renderedCourse);
  const [currentLesson, setCurrentLesson] = useState<CLesson | null>(lesson);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const saveProgress = useCallback(
    async (currentTime: number, duration: number): Promise<void> => {
      if (!(duration > 0) || !Number.isFinite(currentTime) || !Number.isFinite(duration)) return;
      // Percent computed from LOCAL values, not from React state (state is stale until next render)
      const percent = Math.min(100, Math.round((currentTime / duration) * 1000) / 10)
      lastSavedAtRef.current = currentTime;
      try {
        await axios.post(`/api/progress/${courseId}/${lessonId}`, {
          progressValue: percent,
          lastPositionSeconds: currentTime
        })
      } catch (error: unknown) {
        console.error('Failed to save progress')
      }
    }, [courseId, lessonId]
  )
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login')
      // router.back();
    }
  }, [router, status]);


  const handleProgress = (progressPercent: number): void => {
    const validProgress = isNaN(progressPercent) ? 0 : progressPercent;
    setProgressPercent(validProgress);
  };

  // async function saveProgress(currentTime: number, duration: number): void {
  //   if (
  //     duration > 0 &&
  //     Number.isFinite(currentTime) &&
  //     Number.isFinite(duration)
  //   ) {
  //     const lessonProgressPercent = ((currentTime / duration) * 100).toFixed(1);
  //     setProgressSeconds(currentTime)
  //     setProgressPercent(Number(lessonProgressPercent))
  //     console.log(`Progress: ${progressPercent}%`);
  //     await axios.post(`api/progress/${courseId}/${lessonId}`, {
  //       lastPositionSeconds: progressPercent,
  //       progressValue: progressSeconds
  //     })
  //   }
  // };

  const handleTimeUpdate = (currentTime: number, duration: number): void => {
    const validCurrentTime = isNaN(currentTime) ? 0 : Math.floor(currentTime);
    const validDuration = isNaN(duration) ? 0 : duration;
    setWatchTime(validCurrentTime);
    // Calculate progress percentage
    if (validDuration > 0) {
      const progressPercent = Math.floor((validCurrentTime / validDuration) * 100;)
      setProgressPercent((prev) => Math.max(prev, progressPercent));
    }
    // Auto-save progress every 10 seconds
    if (Math.abs(currentTime - lastSavedAtRef.current) >= SAVE_EVERY_SECONDS)
      void saveProgress(validCurrentTime, validDuration);
  }


  // logger.info({ progressPercent }, `Progress`)

  // logger.info({ course }, "Course in the course State");
  console.log("video :", video);


  if (status !== "unauthenticated") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading lesson...</div>
      </div>
    );
  }
  // Derived values, not state
  const isCompleted = progressPercent >= 100;
  if (isLoading) {
    // logger.info({ video }, "video");
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl">Loading lesson...</div>
    </div>;
  }

  return (
    <div className={cn("min-h-screen bg-gray-900 py-8", className)}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Lesson Header */}
        <div className="mb-6">
          <Button
            size="default"
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 text-white border-gray-600 hover:bg-gray-800"
          >
            ← Back to Course
          </Button>
          <h1 className="text-2xl font-bold text-white mb-2">
            {currentLesson?.name || "Video Lesson"}
          </h1>
          <p className="text-gray-400">
            {course?.title} - Lesson {currentLesson?.order || ""}
          </p>
        </div>

        {/* Video Player */}
        <div className="mb-8">
          {video ? (
            <VideoPlayer
              src={video}
              title={lesson.name}
              poster={course.coverImage}
              onProgress={handleProgress}
              onPause={saveProgress}
              onTimeUpdate={handleTimeUpdate}
              onComplete={(duration: number) => void saveProgress(currentTime, duration)}
              playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 2]}
              analytics={true}
              watermark={{
                text: "Brainnest LMS",
                position: "bottom-right",
              }}
              className="w-full"
            />
          ) : (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <p className="text-white text-lg">
                No video available for this lesson
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please contact support if this is an error
              </p>
            </div>
          )}
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Watch Progress</h3>
            <div className="bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-linear-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent || 0}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm">
              {Math.round(progressPercent || 0)}% completed
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Watch Time</h3>
            <p className="text-2xl font-bold text-white">
              {Math.floor((watchTime || 0) / 60)}:
              {Math.floor((watchTime || 0) % 60)
                .toString()
                .padStart(2, "0")}
            </p>
            <p className="text-gray-400 text-sm">minutes watched</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Lesson Status</h3>
            <p className="text-lg font-semibold text-yellow-400">
              {(progressPercent || 0) >= 100 ? "✅ Completed" : "📚 In Progress"}
            </p>
            <p className="text-gray-400 text-sm">
              {(progressPercent || 0) >= 90 ? "Well done!" : "Keep watching"}
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
