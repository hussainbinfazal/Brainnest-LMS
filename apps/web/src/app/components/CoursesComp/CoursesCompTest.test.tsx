import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import CoursesPageComp from "./CoursesPageComp";
import { buildMockCategory, buildMockCourse } from "@/tests/fixture/course.fixture";
import { mockAuthStore, mockCoursesStore, mockUserCourseStore } from "@/tests/mocks/storeMock";
import { mockAxiosError, mockAxiosSuccess } from "@/tests/mocks/axiosMock";

jest.mock("axios");
jest.mock("@/lib/store/useUserCourseStore", () => ({
    useUserCourseStore: jest.fn(),
}));
jest.mock("@/lib/store/useAuthStore", () => ({
    useAuthStore: jest.fn(),
}));
jest.mock("@/lib/store/useCourseStore", () => ({
    useCourseStore: jest.fn(),
}));





jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock("@/utils/logger/clientLogger", () => ({ clientLogger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

//Skeleton as the plain marker
jest.mock("./CoursesPage-skeleton", () => () => <div>skeleton-loading</div>)

const course1 = buildMockCourse({ _id: "course-1", title: "React basics" });
const course2 = buildMockCourse({ _id: "course-2", title: "Angular basics", isPublished: false, instructorId: { name: "Jane" } });

const category = buildMockCategory();

const CoursesPageBaseProps = {
    pagCourses: {
        paginatedCourses: [course1, course2],
        currentPage: 1,
        hasNextPage: true,
        hasPrevPage: false,
        totalPages: 1,
        totalCourses: 2,
    },
    categoryWithChildren: [category],
    initialFacetsCategories: [category],
    initialFacetsLanguages: ['english'],
    initialFacetsLevels: ['beginner'],
};





describe('CoursesPageComp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserCourseStore();
        mockCoursesStore({
            cachedPaginatedCourses: [course1, course2],
            cachedTotalPages: 1,
            cachedTotalCourses: 2,
        });
        mockAuthStore({
            authUser: {
                _id: "user-1",
                name: "Test User",
                email: "test@example.com",
                role: "student",
                isVerified: true,
            },
        });
    });

    it("shows the skeleton on mount, then renders courses once the fetch resolves", async () => {
        render(
            <CoursesPageComp
                pagCourses={CoursesPageBaseProps.pagCourses}
                categoriesWithChildren={CoursesPageBaseProps.categoryWithChildren}
                initialFacetsCategories={CoursesPageBaseProps.initialFacetsCategories}
                initialFacetsLanguages={CoursesPageBaseProps.initialFacetsLanguages}
                initialFacetsLevels={CoursesPageBaseProps.initialFacetsLevels}
            />
        );
        //When isLoading starts true
        expect(screen.getByText("skeleton-loading")).toBeInTheDocument();
        //after fetchAllCourses resolves in the effect, real content replaces the skeleton
        await waitFor(() =>
            expect(screen.getByText("React basics")).toBeInTheDocument())
    });

    it("shows the empty-search message when the search query has no results", async () => {
        render(
            <CoursesPageComp
                pagCourses={CoursesPageBaseProps.pagCourses}
                categoriesWithChildren={CoursesPageBaseProps.categoryWithChildren}
                initialFacetsCategories={CoursesPageBaseProps.initialFacetsCategories}
                initialFacetsLanguages={CoursesPageBaseProps.initialFacetsLanguages}
                initialFacetsLevels={CoursesPageBaseProps.initialFacetsLevels}
            />
        );
        await waitFor(() => expect(screen.getByText("React basics")).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText("Search"), {
            target: {
                value: "nonexistent"
            }
        });
        expect(screen.getByText(/No course found for "nonexistent"/)).toBeInTheDocument();
    });

    it("filters courses by title and by instructor name", async () => {
        render(
            <CoursesPageComp
                pagCourses={CoursesPageBaseProps.pagCourses}
                categoriesWithChildren={CoursesPageBaseProps.categoryWithChildren}
                initialFacetsCategories={CoursesPageBaseProps.initialFacetsCategories}
                initialFacetsLanguages={CoursesPageBaseProps.initialFacetsLanguages}
                initialFacetsLevels={CoursesPageBaseProps.initialFacetsLevels}
            />
        );
        await waitFor(() => expect(screen.getByText("React basics")).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText("Search"), {
            target: {
                value: "Jane"
            }

        });
        // instructor-name match should surface Angular basics, and hide React basics
        expect(screen.getByText("Angular basics")).toBeInTheDocument();
        expect(screen.queryByText("React basics")).not.toBeInTheDocument();
    });

    // BUG-REVEALING TEST — this should fail until onClick is uncommented
    it("applies the active filter style when a category is clicked", async () => {
        render(<CoursesPageComp
            pagCourses={CoursesPageBaseProps.pagCourses}
            categoriesWithChildren={CoursesPageBaseProps.categoryWithChildren}
            initialFacetsCategories={CoursesPageBaseProps.initialFacetsCategories}
            initialFacetsLanguages={CoursesPageBaseProps.initialFacetsLanguages}
            initialFacetsLevels={CoursesPageBaseProps.initialFacetsLevels}
        />);
        await waitFor(() => expect(screen.getByText("React basics")).toBeInTheDocument());

        const categoryLabel = screen.getByText(category.name);
        fireEvent.click(categoryLabel);

        expect(categoryLabel).toHaveClass("text-blue-500");
    });

    it("likes a course: calls POST and shows the filtered heart", async () => {
        mockAxiosSuccess(
            { userCourse: { isLiked: true } },
            "post"
        );
        render(<CoursesPageComp
            pagCourses={CoursesPageBaseProps.pagCourses}
            categoriesWithChildren={CoursesPageBaseProps.categoryWithChildren}
            initialFacetsCategories={CoursesPageBaseProps.initialFacetsCategories}
            initialFacetsLanguages={CoursesPageBaseProps.initialFacetsLanguages}
            initialFacetsLevels={CoursesPageBaseProps.initialFacetsLevels}
        />);

        await waitFor(() => {
            expect(screen.getByText("React basics")).toBeInTheDocument();
        });
        fireEvent.click(screen.getAllByRole("button", { name: "" })[0]);
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/likeCourse/course-1");
        });
    })
    it("rolls back the optimistic like and shows an error toast on failure", async () => {
        mockAxiosError(
            500,
            "Network Error",
            "post"

        );
        const { toast } = require("sonner");
        render(<CoursesPageComp
            pagCourses={CoursesPageBaseProps.pagCourses}
            categoriesWithChildren={CoursesPageBaseProps.categoryWithChildren}
            initialFacetsCategories={CoursesPageBaseProps.initialFacetsCategories}
            initialFacetsLanguages={CoursesPageBaseProps.initialFacetsLanguages}
            initialFacetsLevels={CoursesPageBaseProps.initialFacetsLevels}
        />);
        await waitFor(() => {
            expect(screen.getByText("React basics")).toBeInTheDocument();
            fireEvent.click(screen.getAllByRole("button", { name: "" })[0]);
        })
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Failed to like course"));
        });

    });

    it("re-fetches page 2's data when the next pagination link is clicked", async () => {
        const { fetchPaginatedCourse } = mockCoursesStore({
            cachedPaginatedCourses: [course1, course2],
            cachedTotalPages: 3,
        });
        render(<CoursesPageComp
            pagCourses={CoursesPageBaseProps.pagCourses}
            categoriesWithChildren={CoursesPageBaseProps.categoryWithChildren}
            initialFacetsCategories={CoursesPageBaseProps.initialFacetsCategories}
            initialFacetsLanguages={CoursesPageBaseProps.initialFacetsLanguages}
            initialFacetsLevels={CoursesPageBaseProps.initialFacetsLevels}
        />)
        await waitFor(() => expect(screen.getByText("React basics")).toBeInTheDocument());
        fireEvent.click(screen.getByText("2"))

        await waitFor(() =>
            expect(fetchPaginatedCourse).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })));
    });


})


// pnpm --dir .\apps\web test -- --run src/app/components/CoursesComp/CoursesCompTest.test.tsx
