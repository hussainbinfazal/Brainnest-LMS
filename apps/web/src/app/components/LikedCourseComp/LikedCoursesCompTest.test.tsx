// Import RTL utilities: render mounts the component, screen queries the DOM, fireEvent simulates user actions, waitFor polls for async updates

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import LikedCoursesPageComp from "./LikedCourseComp";
import { useUserCourseStore } from "@/lib/store/useUserCourseStore";
import { useAuthStore } from "@/lib/store/useAuthStore";

jest.mock("axios"); // mock axios with all its methods (post/delete/put);

// Mock next / navigation's useRouter so router.push doesn't try to touch real Next.js routing
jest.mock("next/navigation", () => ({
    // Return an object shaped like the real hook's return valuee
    useRouter: () => ({ push: jest.fn() }),
}));

// Mock sonner's toast so calling toast.success/error doesn't try to render a real toast UI
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock the course store module entirely; we control its behavior per-test below
jest.mock("@/lib/store/useUserCourseStore");

//Mock the auth store module entirely; we control its behavior per-test below
jest.mock("@/lib/store/useAuthStore");


//Mock the whole client logger module entirely; we control its behavior per-test below
jest.mock("@/utils/logger/clientLogger", () => ({
    clientLogger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    }
}));
// Fake course object shaped like what the API/props would actually provid
const mockCourse = {
    //Matches the courseId shaped like what API/props would actually provide
    _id: "course-1",
    title: "Full-Stack Web development",
    topic: "Web development",
    description: "Learn Full-Stack Web development from scratch.",
    coverImage: "https://example.com/course.jpg",
    instructorId: {
        _id: "instructor-1",
        name: "Test Instructor",
        profileImage: "https://example.com/instructor.jpg",
    },
    averageRating: 4.5,
    price: 19.99,
    discount: 0,
    level: "beginner",
    totalEnrolledCount: 42,
    language: "English",
    status: "published",
    topics: [],
    totalReviews: 42,
    ratingDistribution: [],
    totalLessons: 0,
    category: {
        _id: "category-1",
        name: "development",
        slug: "development",
        parent: null,
    },
    driptType: "free",
    totalDurationInSeconds: 0,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
};

//Group all tests  for this component for this under one describe for readabale object

describe("LikedCoursesPageComp", () => {
    //Runs before each individual test (its block) below
    beforeEach(() => {
        //Reset call counts/return values on all tests don't leak state into each other'
        jest.clearAllMocks();
        //Zustand hooks are called as useStore(selectorFN) - so our mock must itself accpet a selector and run it
        (useUserCourseStore as unknown as jest.Mock).mockImplementation(
            (selector) =>
                //Call the selector against a fake state object, same as the real store would
                selector({
                    //Fake version of the "like" state setter - component calls this but we don't need to do it do anything
                    updateUserCourse: jest.fn(),

                    //Empty array since no test currently depends on real liked IDs
                    likeCourseIds: [],

                    //Fake setter for the "is updating" flag per course
                    setUpdatingLike: jest.fn(),

                    //Fake setter for updating a single course's cached data
                    setUserCourseById: jest.fn(),

                    //Fake async fetcher for a single course's data
                    fetchUserCourseById: jest.fn(),

                    //Empty object :no course is currently mid-update
                    isUpdatingLikeByCourseId: {},

                    //Empty object : no cached data for any course
                    userCourseByCourseId: {},
                })
        );
        // The component also calls useUserCourseStore.getState() directly (not just as a hook) — mock that separately
        (useUserCourseStore as unknown as { getState: jest.Mock }).getState =
            jest.fn(() => ({
                //Same shape as above but returned directly, not via a selector
                userCourseByCourseId: {},
                isUpdatingLikeByCourseId: {},

                //Fake 'cache' the component reads after fetchAllLikedCourses resolves
                cachedLikedCourses: [],

                //Fake current page number from cache
                cachedLikedCurrentPageNumber: 1,

                //Fake total pages from cache
                cachedLikedTotalPages: 1,

                //Fake total course count from cache
                cachedLikedTotalCourses: 0,

                //Fake "has Next Page" flag
                cachedLikedHasNextPage: false,

                //Fake "has Previous Page" flag
                cachedLikedHasPrevPage: false,
            }));

        //Mock the auth store the same way : it's also called as useAuthStore(selector) - so our mock must itself accpet a selector and run it

        (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
            selector({
                authUser: {
                    _id: "user-1",
                    name: "Test User",
                    email: "4c4wT@example.com",
                    role: "student",
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-01"),
                },
            })
        );
    });

    //Test cases
    //Each test is a block of code that runs once
    it("renders liked courses passed in as a props", () => {
        //Render the component with the props
        render(<LikedCoursesPageComp userLikedCourses={[mockCourse as any]} />);
        //Assert the course title text actually appears in the rendered DOM
        expect(screen.getByText("Full-Stack Web development")).toBeInTheDocument();
        //Assert the price is rendered with ₹ symbol as the component formats it
        expect(screen.getByText((_, element) => element?.textContent === "₹ 19.99")).toBeInTheDocument();
    });

    //Test 2: empty -state rendering -does the "no-courses" message show when the array is empty?
    it("shows empty state when there are no liked courses", () => {
        //Render with an empty array of liked courses
        render(<LikedCoursesPageComp userLikedCourses={[]} />);
        //Assert the empty-state text is shown instead of any course cards
        expect(screen.getByText("No Liked Courses Found"));
    });
    //Text 3 : the main user action - unliking a course
    it("calls the dislike API and removes the course on unlike click", async () => {
        //Configure the mocked axios.delete resolve successfully exactly once, with a fake reponse shape
        (axios.delete as jest.Mock).mockResolvedValueOnce({
            data: { userCourse: { isLiked: false, likedAt: null } },
        });

        //Render the component with one course so there's something to unlike
        render(<LikedCoursesPageComp userLikedCourses={[mockCourse as any]} />);

        //Grab all buttons and take the first one, which is the delete/unlike icon button in card Footer
        const unlikeButton = screen.getAllByRole("button")[0];
        //simulate a real user click on that button
        fireEvent.click(unlikeButton);

        //Wait for the async axios.delete call to acutally fired, since click handlers run async work after returning
        await waitFor(() => {
            //Assert axios.delete was called with a URL containing the correct course ID
            expect(axios.delete).toHaveBeenCalledWith(
                expect.stringContaining("api/dislikeCourse/course-1")
            );
        });

        //Wait again for the resulting state update (removal from the list) to be reflected in the DOM
        await waitFor(() =>
            //Assert the course title is no longer rendered, since it was optimistically/actually removed)
            expect(
                screen.queryByText("Full-Stack Web development")
            ).not.toBeInTheDocument()
        );
    });


    //Test 4: the failure Path - what happens when the API calls fails
    it('rolls back optimistic update and shows error toast on API failure', async () => {
        //Configure axios.delete to reject with a fake error(network/server error) exactly once
        (axios.delete as jest.Mock).mockRejectedValueOnce(new Error("Network/server/API Error"));
        //Pull in the mocked toast object so we can assert on toast.error later
        const { toast } = require("sonner");
        //Render the component with the fake course
        render(<LikedCoursesPageComp userLikedCourses={[mockCourse as any]} />);

        //Click the unlike button to trigger the failing request
        fireEvent.click(screen.getAllByRole("button")[0]);
        //Wait for the catch block't toast.error call to fire after the rejected promise
        await waitFor(() => {
            //Assert toast.error was called with the expected error message
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Failed to "));
        })
    })
});
