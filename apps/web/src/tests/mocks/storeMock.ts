import { useUserCourseStore } from "@/lib/store/useUserCourseStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { useCourseStore } from "@/lib/store/useCourseStore";
import { useProgressStore } from "@/lib/store/useProgressStore";
import { createStoreMock } from "./createStoreMock";
import { CCourse } from "@/types/client";


export const mockUserCourseStore = createStoreMock(useUserCourseStore, {
    isUpdatingLikeByCourseId: {} as Record<string, boolean>,
    isLoading: false,
    setUserCourseById: jest.fn(),
    fetchUserCourseById: jest.fn(),
    fetchUserCoursesByIds: jest.fn(),
    fetchAllUserCoursesByUserIds: jest.fn(),
    fetchUserLikedCourses: jest.fn(),
    updateUserCourse: jest.fn(),
    getUserCourseById: jest.fn(),
    setUserLikedCourses: jest.fn(),
    setAllUserCoursesByUserIds: jest.fn(),
    setUpdatingLike: jest.fn(),
    clearUserCourseById: jest.fn(),
    enrolledCourseIds: new Set<string>(),
    likedCourseIds: new Set<string>(),
    userCourseByCourseId: {},
    cachedLikedCurrentPageNumber: 1,
    cachedLikedTotalPages: 1,
    cachedLikedHasNextPage: false,
    cachedLikedHasPrevPage: false,
    cachedLikedTotalCourses: 0,
    cachedLikedCourses: [] as CCourse[],

});

export const mockAuthStore = createStoreMock(useAuthStore, {
    authUser: null,
    setAuthUser: jest.fn(),
    clearAuthUser: jest.fn(),
    setAuthLoading: jest.fn(),
    isAuthLoading: true,
    userLocation: null,
    setUserLocation: jest.fn(),
    fetchUser: jest.fn(),
    saveUserGeography: jest.fn(),
});

export const mockCoursesStore = createStoreMock(useCourseStore, {
    courses: [],
    cachedCurrentPageNumber: 1,
    cachedTotalPages: 1,
    cachedHasNextPage: false,
    cachedHasPrevPage: false,
    cachedTotalCourses: 0,
    cachedPaginatedCourses: [],
    reviews: [],
    categories: [],
    isLoading: false,
    hasFetched: false,
    fetchCourses: jest.fn(),
    fetchPaginatedCourse: jest.fn(),
    setPaginatedCourses: jest.fn(),
    setCourses: jest.fn(),
    clearCourses: jest.fn(),
    clearPaginatedCourses: jest.fn(),
})

