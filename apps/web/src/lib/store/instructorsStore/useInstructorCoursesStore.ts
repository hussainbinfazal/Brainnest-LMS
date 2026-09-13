"use client";


import { create } from "zustand";
import axios from "axios";
import { CCourse, CAuthUser } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";
export interface CInstructorCourseStore {
    cachedPaginatedInstructorCourses: CCourse[];
    cachedCurrentPageNumber: number;
    cachedTotalPages: number;
    cachedHasNextPage: boolean;
    cachedHasPrevPage: boolean;
    cachedTotalCourses: number
    isLoading: boolean;
    hasFetched: boolean;

    fetchPaginatedInstructorCourses: (options: {
        page: number; itemsPerPage: number, instructorId: string
    }) => Promise<{ paginatedInstructorCourses: CCourse[], currentPage: number, hasNextPage: boolean, hasPrevPage: boolean, totalPages: number, totalCourses: number }>;
    setPaginatedInstructorCourses: (newPaginatedInstructorCourses: CCourse[], newHasNextPage: boolean, newHasPrevPage: boolean, newCurrentPageNumber: number, newTotalPages: number, newTotalCourses: number) => void;

    deleteInstructorCourse: (options: { page: number, itemsPerPage: number, courseId: string, instructorId: string }) => void;
    clearPaginatedInstructorCourses: () => void;
    setInstructorCourses: (courses: CCourse[]) => void;
}

export const useInstructorCoursesStore = create<CInstructorCourseStore>((set, get) => ({
    cachedPaginatedInstructorCourses: [] as CCourse[],
    cachedCurrentPageNumber: 1,
    cachedTotalPages: 1,
    cachedHasNextPage: false,
    cachedHasPrevPage: false,
    cachedTotalCourses: 0,
    isLoading: false,
    hasFetched: false,


    fetchPaginatedInstructorCourses: async ({ page, itemsPerPage, instructorId }: { page: number, itemsPerPage: number, instructorId: string }) => {
        set({ isLoading: true })
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
            });
            const response = await axios.get(
                `/api/admin/course/${instructorId.toString()}?${params.toString()}`
            );
            const {
                paginatedInstructorCourses,
                currentPage,
                totalPages,
                hasNextPage,
                hasPrevPage,
                totalInstructorCourses,
            } = response.data.data;
            const totalCourses = totalInstructorCourses;
            const newPaginatedInstructorCourses = paginatedInstructorCourses;
            get().setPaginatedInstructorCourses(newPaginatedInstructorCourses, hasNextPage, hasPrevPage, currentPage, totalPages, totalCourses);
            set({
                cachedCurrentPageNumber: currentPage,
                cachedTotalPages: totalPages,
                cachedHasNextPage: hasNextPage,
                cachedHasPrevPage: hasPrevPage,
            });
            return {
                paginatedInstructorCourses,
                currentPage,
                hasNextPage,
                hasPrevPage,
                totalPages,
                totalCourses
            };
        }
        catch (error: unknown) {
            const message: string = error instanceof Error ? error.message : "Something went wrong";
            clientLogger.error("Error fetching paginated instructor courses through instructor Store", { message, error });
            return {
                paginatedInstructorCourses: [],
                currentPage: page,
                hasNextPage: false,
                hasPrevPage: page > 1,
                totalPages: 1,
                totalCourses: 0,
            };
        }
        finally {
            set({ isLoading: false })
        }
    },
    deleteInstructorCourse: async ({ page, itemsPerPage, courseId, instructorId }: { page: number, itemsPerPage: number, courseId: string, instructorId: string }) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
                courseId: courseId.toString()
            })
            const response = await axios.delete(`/api/admin/course/${instructorId}?${params.toString()}`);
            clientLogger.info("Instructor course deleted successfully", { courseId, message: response.data.message });
            return await get().fetchPaginatedInstructorCourses({ page, itemsPerPage, instructorId });
        }
        catch (error: unknown) {
            const message: string = error instanceof Error ? error.message : "Something went wrong";
            clientLogger.error("Error deleting instructor course through instructor Store", { message, error });
            return {
                paginatedInstructorCourses: [],
                currentPage: page,
                hasNextPage: false,
                hasPrevPage: page > 1,
                totalPages: 1,
                totalCourses: 0,
            };
        }

    },
    setPaginatedInstructorCourses: (newPaginatedInstructorCourses, newHasNextPage, newHasPrevPage, newCurrentPageNumber, newTotalPages, newTotalCourses) => {
        set({
            cachedPaginatedInstructorCourses: newPaginatedInstructorCourses,
            cachedHasNextPage: newHasNextPage,
            cachedHasPrevPage: newHasPrevPage,
            cachedCurrentPageNumber: newCurrentPageNumber,
            cachedTotalPages: newTotalPages,
            cachedTotalCourses: newTotalCourses,
            hasFetched: true,
        });
    },
    clearPaginatedInstructorCourses: () => {
        set({
            cachedPaginatedInstructorCourses: [],
            cachedCurrentPageNumber: 1,
            cachedTotalPages: 1,
            cachedHasNextPage: false,
            cachedHasPrevPage: false,
            cachedTotalCourses: 0,
            hasFetched: false,
        });
    },
    setInstructorCourses: (courses) => {
        set({
            cachedPaginatedInstructorCourses: courses,
            cachedTotalCourses: courses.length,
            hasFetched: true,
        });
    },
}))