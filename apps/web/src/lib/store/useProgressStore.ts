"use client";

import { create } from "zustand";
import { CProgressStore, CProgress, CLessonProgress, CSection } from "@/types/client";
import axios from "axios";


export interface CSectionProgress {
    sectionId: string;
    completedCount: number;
    totalLessons: number;
}
export const useProgressStore = create<CProgressStore>(
    (set, get) => ({
        progressByCourse: {},
        progressByLessons: {} as Record<string, CLessonProgress[]>,
        loadingByCourse: {},
        loadingLessonsProgress: {},

        fetchCourseProgress: async (courseId: string) => {
            const existingProgress =
                get().progressByCourse[courseId];

            const existingLessonsProgress =
                get().progressByLessons[courseId];
            // Already fetched
            if (existingProgress) {
                return;
            }

            if (existingLessonsProgress) {
                return;
            }

            // Already fetching
            if (get().loadingByCourse[courseId]) {
                return;
            }
            if (get().loadingLessonsProgress[courseId]) {
                return;
            }

            set((state) => ({
                loadingByCourse: {
                    ...state.loadingByCourse,
                    [courseId]: true,
                },
                loadingLessonsProgress: {
                    ...state.loadingLessonsProgress,
                    [courseId]: true,
                },
            }));

            try {
                // const response = await axios.get(
                //     `/api/progress/${courseId}`
                // );

                ///Update these urls to fetch the course progress and lessons progress separately
                const [progressResponse, progressLessonResponse] = await Promise.all([
                    await axios.get(
                        `/api/progress/complete/${courseId}/$`
                    ),
                    await axios.get(
                        `/api/progress/lessons/${courseId}`
                    ),

                ])

                set((state) => ({
                    progressByCourse: {
                        ...state.progressByCourse,
                        [courseId]: progressResponse.data.courseProgress,
                    },
                    progressByLessons: {
                        ...state.progressByLessons,
                        [courseId]: progressLessonResponse.data.userLessonsProgress,
                    },
                }));
            } catch (error: unknown) {
                console.error(
                    "Failed to fetch course progress",
                    error
                );
            } finally {
                set((state) => ({
                    loadingByCourse: {
                        ...state.loadingByCourse,
                        [courseId]: false,
                    },
                }));
            }
        },

        setCourseProgress: (
            courseId: string,
            progress: CProgress
        ) =>
            set((state) => ({
                progressByCourse: {
                    ...state.progressByCourse,
                    [courseId]: progress,
                },
            })),
        setLessonsProgress: (
            courseId: string,
            userLessonsProgress: CLessonProgress[]
        ) =>
            set((state) => ({
                progressByLessons: {
                    ...state.progressByLessons,
                    [courseId]: userLessonsProgress,
                },
            })),

        //To be complete
        isLessonCompleted: (
            courseId: string,
            lessonId: string
        ) => {
            const lessonProgress =
                get().progressByLessons[courseId];

            return (
                lessonProgress?.filter((progress) => progress.lessonId === lessonId && progress.status === "completed" && progress.progressPercentage === 100).length > 0 ? true : false
            );
        },

        markLessonCompleted: async (
            courseId: string,
            lessonId: string,
            sectionId: string,
            userId: string
        ) => {
            const response = await axios.post(`/api/progress/complete/${courseId}/${lessonId}`);
            const updatedProgress = response.data.courseProgress;
            const updatedLesson = response.data.lessonProgress
            useProgressStore.getState().setCourseProgress(courseId, updatedProgress);
            set((state) => {
                const current =
                    state.progressByCourse[courseId];

                if (!current) return state;

                if (
                    current.sectionProgress.filter((section: CSectionProgress) => section.sectionId === sectionId && section.completedCount >= section.totalLessons).length > 0 // If the section is already completed, do not mark the lesson as completed
                ) {
                    return state;
                }

                const existing = state.progressByLessons[courseId] || [];
                const next = existing.some((item) => item.lessonId === updatedLesson.lessonId)
                    ? existing.map((item) =>
                        item.lessonId === updatedLesson.lessonId
                            ? { ...item, ...updatedLesson }
                            : item
                    )
                    : [...existing, updatedLesson];
                return {
                    progressByLessons: {
                        ...state.progressByLessons,
                        [courseId]: next,
                    }
                };
            });

        },

        clearCourseProgress: (courseId: string) =>
            set((state) => {
                const {
                    [courseId]: _,
                    ...remaining
                } = state.progressByCourse;
                const {
                    [courseId]: __,
                    ...remainingLessons
                } = state.progressByLessons;

                return {
                    progressByCourse: remaining,
                    progressByLessons: remainingLessons,
                };
            }),
    })
);