import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCourseStore } from "@/lib/store/useCourseStore";
import { toast } from "sonner";
import type { CCourse, CCategory, CReview } from "@/types/client";
import { CCategoryWithChildren } from "@/lib/getCachedCategory";
import "@testing-library/jest-dom";
import axios from "axios";
import CourseIdPageComp from "./CourseIdPageComp";
import { useCartStore } from "@/lib/store/useCartStore";
import { useUserCourseStore } from "@/lib/store/useUserCourseStore";
import { useProgressStore } from "@/lib/store/useProgressStore";

// --------------------------------------------------
// MOCKS
// --------------------------------------------------

jest.mock("axios");

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({
    courseId: "course-123",
  })),
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
  })),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} alt={props.alt || ""} />;
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => "toast-id"),
    dismiss: jest.fn(),
  },
}));

jest.mock("@/utils/logger/clientLogger", () => ({
  clientLogger: {
    error: jest.fn(),
  },
}));

jest.mock("@/utils/date", () => ({
  formatRelativeDate: jest.fn(() => "2 days ago"),
}));

jest.mock("@/utils/timeFormat", () => ({
  convertToTotalHours: jest.fn((seconds: number) => Math.round(seconds / 3600)),
  formatRatingNumber: jest.fn((rating: number) => rating.toFixed(1)),
}));

// --------------------------------------------------
// MOCK UI COMPONENTS
// --------------------------------------------------

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/carousel", () => ({
  Carousel: ({ children }: any) => <div>{children}</div>,
  CarouselContent: ({ children }: any) => <div>{children}</div>,
  CarouselItem: ({ children }: any) => <div>{children}</div>,
  CarouselNext: () => <button aria-label="next">Next</button>,
  CarouselPrevious: () => <button aria-label="previous">Previous</button>,
}));

jest.mock("@/app/components/shared/StarRating", () => ({
  __esModule: true,
  default: ({ rating }: { rating: number }) => (
    <div data-testid="star-rating">{rating}</div>
  ),
}));

jest.mock("./CourseId-Page-Skeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="course-page-skeleton">Loading...</div>,
}));

jest.mock("embla-carousel-autoplay", () => {
  return jest.fn(() => ({}));
});

// --------------------------------------------------
// MOCK REACT ICONS
// --------------------------------------------------

jest.mock("react-icons/ti", () => ({
  TiTick: () => <span data-testid="tick-icon" />,
}));

jest.mock("react-icons/lu", () => ({
  LuOctagonAlert: () => <span />,
  LuCaptions: () => <span />,
}));

jest.mock("react-icons/io5", () => ({
  IoGlobeOutline: () => <span />,
}));

jest.mock("react-icons/ri", () => ({
  RiVerifiedBadgeLine: () => <span />,
}));

jest.mock("react-icons/md", () => ({
  MdOutlinePeopleAlt: () => <span />,
  MdOutlineOndemandVideo: () => <span />,
}));

jest.mock("react-icons/im", () => ({
  ImQuotesLeft: () => <span />,
}));

jest.mock("react-icons/sl", () => ({
  SlBadge: () => <span />,
}));

jest.mock("react-icons/fa6", () => ({
  FaRegHeart: ({ onClick }: any) => (
    <button aria-label="like-course" onClick={onClick}>
      Like
    </button>
  ),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
}));

jest.mock("react-icons/bs", () => ({
  BsCartCheckFill: ({ onClick }: any) => (
    <button aria-label="remove-from-cart" onClick={onClick}>
      Remove Cart
    </button>
  ),
  BsCart2: ({ onClick }: any) => (
    <button aria-label="add-to-cart" onClick={onClick}>
      Add Cart
    </button>
  ),
}));

jest.mock("react-icons/tb", () => ({
  TbMessageUser: () => <span />,
}));

jest.mock("react-icons/ci", () => ({
  CiTrophy: () => <span />,
}));
jest.mock("react-icons/io", () => ({
  IoMdHeart: ({ onClick }: any) => (
    <button aria-label="liked-course" onClick={onClick}>
      Liked
    </button>
  ),

  IoIosArrowDown: ({ onClick }: any) => (
    <svg data-testid="arrow-down" onClick={onClick} />
  ),

  IoIosArrowUp: ({ onClick }: any) => (
    <svg data-testid="arrow-up" onClick={onClick} />
  ),
}));
jest.mock("react-icons/go", () => ({
  GoDotFill: () => <span />,
}));

jest.mock("react-icons/fa", () => ({
  FaEye: ({ onClick }: any) => (
    <button aria-label="view-lesson" onClick={onClick}>
      View
    </button>
  ),
  FaStar: ({ onClick }: any) => (
    <span data-testid="review-star" onClick={onClick}>
      Star
    </span>
  ),
}));

jest.mock("lucide-react", () => ({
  CircleUser: () => <span />,
}));

// --------------------------------------------------
// MOCK ZUSTAND STORES
// --------------------------------------------------

const mockSetAuthUser = jest.fn();
const mockFetchCart = jest.fn();
const mockSetUserCourseById = jest.fn();
const mockGetUserCourseById = jest.fn();
const mockClearUserCourseById = jest.fn();
const mockFetchUserCourseById = jest.fn();
const mockUpdateUserCourse = jest.fn();
const mockSetUpdatingLike = jest.fn();
const mockUseSession = useSession as unknown as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;
let mockUser: any = null;
const mockedAuthStore = useAuthStore as unknown as jest.Mock;
let mockUserCourseByCourseId: Record<string, any> = {};
const user = userEvent.setup();
let mockCart = {
  courses: [] as CCourse[],
};
const mockFetchCourseProgress = jest.fn();
const mockIsLessonCompleted = jest.fn();

const mockAuthState = {
  authUser: null as any,
  setAuthUser: mockSetAuthUser,
};

const mockCartState = {
  cart: {
    courses: [] as CCourse[],
  },
  fetchCart: mockFetchCart,
  setCart: jest.fn(),
};

const mockUserCourseState = {
  userCourseByCourseId: {} as Record<string, any>,
  isUpdatingLikeByCourseId: {} as Record<string, boolean>,

  setUserCourseById: mockSetUserCourseById,
  getUserCourseById: mockGetUserCourseById,
  clearUserCourseById: mockClearUserCourseById,
  fetchUserCourseById: mockFetchUserCourseById,
  updateUserCourse: mockUpdateUserCourse,
  setUpdatingLike: mockSetUpdatingLike,
};

const mockProgressState = {
  progressByCourse: {},
  progressByLessons: {},
  fetchCourseProgress: mockFetchCourseProgress,
  isLessonCompleted: mockIsLessonCompleted,
  setCourseProgress: jest.fn(),
  setLessonsProgress: jest.fn(),
};

jest.mock("@/lib/store/useAuthStore", () => ({
  useAuthStore: jest.fn((selector?: any) =>
    selector ? selector(mockAuthState) : mockAuthState
  ),
}));

jest.mock("@/lib/store/useCartStore", () => ({
  useCartStore: jest.fn((selector?: any) =>
    selector ? selector(mockCartState) : mockCartState
  ),
}));

jest.mock("@/lib/store/useUserCourseStore", () => ({
  useUserCourseStore: Object.assign(
    jest.fn((selector?: any) =>
      selector ? selector(mockUserCourseState) : mockUserCourseState
    ),
    {
      getState: jest.fn(() => mockUserCourseState),
    }
  ),
}));

jest.mock("@/lib/store/useProgressStore", () => ({
  useProgressStore: jest.fn((selector?: any) =>
    selector ? selector(mockProgressState) : mockProgressState
  ),
}));

// --------------------------------------------------
// TEST DATA
// --------------------------------------------------

const course = {
  _id: "course-123",
  title: "Modern JavaScript from Scratch",
  topic: "js",
  discount: 10,
  totalEnrolledCount: 100,
  totalLessons: 10,
  category: {
    _id: "category-1",
    name: "Web Development",
    slug: "web-development",
    parent: null,
  },
  certificate: "klsdajf;lsdkjfaf;klsdjf",
  description:
    "This is a very long description that contains more than one hundred characters so that we can test the show more and show less functionality of the course description.",

  price: 999,
  language: "English",
  averageRating: 4.5,
  status: "published",
  level: "beginner",
  coverImage: "/course.jpg",
  totalDurationInSeconds: 5090,
  totalReviews: 788,
  ratingDistribution: [
    {
      1: 2,
      2: 4,
      3: 4,
      4: 3,
      5: 3,
    },
  ],

  whatYouWillLearn: [
    "JavaScript fundamentals",
    "Advanced JavaScript",
    "Async programming",
  ],

  requirements: ["Basic programming knowledge", "A computer"],
  instructorId: {
    _id: "instructor-1",
    name: "Hussain",
    profileImage: "",
  },
  createdAt: "2026-08-01",
  updatedAt: "2026-08-01",
} as unknown as CCourse;
const reviews = [
  {
    _id: "review-1",
    rating: 5,
    comment: "Excellent course!",
    createdAt: "2026-08-01",
    user: {
      name: "John",
      profileImage: "",
    },
  },
];

const sections = [
  {
    _id: "section-1",
    title: "JavaScript Basics",
    lessons: [
      {
        _id: "lesson-1",
        title: "Introduction",
        durationInSeconds: 600,
      },
      {
        _id: "lesson-2",
        title: "Variables",
        durationInSeconds: 600,
      },
    ],
  },
];

const allCategories = [
  {
    _id: "cat-1",
    name: "Development",
    slug: "development",
    children: [],
  },
];

const courseCategory = {
  _id: "cat-1",
  name: "Development",
  slug: "development",
  children: [
    {
      _id: "subcat-1",
      name: "JavaScript",
      slug: "javascript",
    },
  ],
};

const instructorStats = {
  totalReviews: 100,
  totalCourses: 10,
};

const userCourseStats = {
  _id: "user-course-1",
  isLiked: false,
  isEnrolled: false,
  isCompleted: false,
};

const uProgress = null;
const allLessons = [
  {
    _id: "lesson-1",
    name: "Introduction",
    courseId: "course-1",
    videoUrl: "https://example.com/video.mp4",
    description: "Introduction to JavaScript",
    isPreview: false,
    isPreviewVideo: "",
    durationInSeconds: 600,
    sectionId: "section-1",
  },
  {
    _id: "lesson-2",
    name: "Variables",
    courseId: "course-2",
    videoUrl: "https://example.com/video.mp4",
    description: "Complexities to JavaScript",
    isPreview: true,
    isPreviewVideo: "https://example.com/preview.mp4",
    durationInSeconds: 600,
    sectionId: "section-1",
  },

]

const defaultProps: any = {
  initialCourse: course,
  initialReviews: reviews,
  allCategories,
  courseCategory,
  relevantCategoryCourses: [course],
  instructorStats,
  userCourseStats,
  allLessons,
  otherCoursesByInstructor: [],
  initialTopic: null,
  allSections: sections,
  uProgress,
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const renderComponent = (props = {}) => {
  return render(<CourseIdPageComp {...defaultProps} {...props} />);
};

// --------------------------------------------------
// TEST SETUP
// --------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  mockSetAuthUser.mockReset();
  mockFetchCart.mockReset();

  mockSetUserCourseById.mockReset();
  mockGetUserCourseById.mockReset();
  mockClearUserCourseById.mockReset();
  mockFetchUserCourseById.mockReset();
  mockUpdateUserCourse.mockReset();
  mockSetUpdatingLike.mockReset();



  //User Progress Store 
  mockFetchCourseProgress.mockReset();
  mockIsLessonCompleted.mockReset();
  // Restore implementations if needed
  mockProgressState.isLessonCompleted.mockReturnValue(false);
  mockAuthState.authUser = null;
  mockUserCourseState.userCourseByCourseId = {
    "course-123": {
      isLiked: false,
    },
  };
  mockUserCourseState.isUpdatingLikeByCourseId = {};
  mockCartState.cart = {
    courses: [],
  };

  mockProgressState.isLessonCompleted.mockReturnValue(false);

  mockUseSession.mockReturnValue({
    data: null,
    status: "unauthenticated",
  });

  mockRouterPush.mockClear();

  (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: any) =>
    selector ? selector(mockAuthState) : mockAuthState
  );

  (useCartStore as unknown as jest.Mock).mockImplementation((selector?: any) =>
    selector ? selector(mockCartState) : mockCartState
  );

  (useProgressStore as unknown as jest.Mock).mockImplementation(
    (selector?: any) =>
      selector ? selector(mockProgressState) : mockProgressState
  );

  (useUserCourseStore as unknown as jest.Mock).mockImplementation(
    (selector?: any) =>
      selector ? selector(mockUserCourseState) : mockUserCourseState
  );

  (mockedAxios.get as unknown as jest.Mock).mockImplementation(
    (url: string) => {
      if (url === "/api/users/me") {
        return Promise.resolve({
          data: {
            user: null,
          },
        });
      }

      return Promise.resolve({
        data: {},
      });
    }
  );
});

// --------------------------------------------------
// RENDER TEST
// --------------------------------------------------

describe("CourseIdPageComp - Rendering", () => {
  test("renders course information", async () => {
    renderComponent();

    expect(
      screen.getByText("Modern JavaScript from Scratch")
    ).toBeInTheDocument();

    expect(screen.getByText("Bestseller")).toBeInTheDocument();

    expect(screen.getByText("₹ 999")).toBeInTheDocument();

    expect(screen.getByTestId("course-language")).toHaveTextContent("English");

    expect(screen.getByText("What you'll learn")).toBeInTheDocument();

    expect(screen.getByText("JavaScript fundamentals")).toBeInTheDocument();

    expect(screen.getByText("Requirements")).toBeInTheDocument();

    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  test("renders formatted course update date", () => {
    renderComponent();

    expect(screen.getByText("Last updated on 8/2026")).toBeInTheDocument();
  });

  test("renders instructor information", () => {
    renderComponent();

    expect(screen.getByText("Hussain")).toBeInTheDocument();
  });

  test("renders related category", () => {
    renderComponent();

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });
});

// --------------------------------------------------
// DESCRIPTION
// --------------------------------------------------

describe("CourseIdPageComp - Description", () => {
  test("truncates long description initially", () => {
    renderComponent();

    const showMoreButton = screen.getByRole("button", {
      name: /Show more/i,
    });

    expect(showMoreButton).toBeInTheDocument();
  });

  test("expands description when Show more is clicked", async() => {
    renderComponent();

    const expandButton = screen.getByRole("button", {
      name: "expand-section",
    });

    expect(expandButton).toBeInTheDocument();

    await user.click(expandButton);

    expect(
      screen.getByRole("button", {
        name: "collapse-section",
      })
    ).toBeInTheDocument();
  });

  test("collapses description when Show less is clicked", async () => {
    renderComponent();

    //User will click show more button to 
    const showMoreButton = screen.getByRole("button", {
      name: /Show more/i,
    });
    await user.click(showMoreButton);

    const showLessButton = screen.getByRole("button", {
      name: /Show less/i,
    });
    expect(showLessButton).toBeInTheDocument();

    await user.click(showLessButton); //User Event always return a promise, it should be awaited in the test

    expect(
      screen.getByRole("button", {
        name: "Show more",
      })
    ).toBeInTheDocument();
  });
});

// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------

describe("CourseIdPageComp - Authentication", () => {
  test("redirects unauthenticated user to login when liking", async () => {
    // mockedAuthStore.mockReturnValue({
    //   user: null,
    // });
    mockedAuthStore.mockImplementation((selector) =>
      selector({ authUser: null, setAuthUser: mockSetAuthUser })
    );
    renderComponent();

    const user = userEvent.setup();

    const likeButton = screen.getByRole("button", {
      name: "like-course",
    });

    await user.click(likeButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/login");
      expect(toast.error).toHaveBeenCalledWith("Please login first");
    });
  });
});

// --------------------------------------------------
// LIKE COURSE
// --------------------------------------------------

describe("CourseIdPageComp - Like Course", () => {
  beforeEach(() => {
    mockUser = {
      _id: "user-1",
      name: "Test User",
      role: "student",
      profileImage: "/profile.jpg",
      email: "test@example.com",
      phoneNumber: "9999999999",
    };

    mockAuthState.authUser = mockUser;

    (mockedAxios.post as unknown as jest.Mock).mockResolvedValue({
      data: {
        userCourse: {
          _id: "user-course-1",
          isLiked: true,
          likedAt: new Date(),
        },
      },
    });
  });

  test("likes a course successfully", async () => {
    renderComponent();

    const user = userEvent.setup();
    const likeButton = screen.getByRole("button", {
      name: "like-course",
    });

    await user.click(likeButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/likeCourse/course-123"
      );
    });

    expect(mockSetUpdatingLike).toHaveBeenCalledWith("course-123", true);

    expect(mockUpdateUserCourse).toHaveBeenCalledWith(
      "course-123",
      expect.objectContaining({
        isLiked: true,
      })
    );

    expect(mockSetUserCourseById).toHaveBeenCalledWith(
      "course-123",
      expect.objectContaining({
        isLiked: true,
      })
    );

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Course liked!")
    );

    expect(mockSetUpdatingLike).toHaveBeenCalledWith("course-123", false);
  });

  test("does not send duplicate like request", async () => {
    mockUserCourseState.isUpdatingLikeByCourseId = {
      "course-123": true,
    };

    renderComponent();

    await user.click(
      screen.getByRole("button", {
        name: "like-course",
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "You have already liked this course"
      );
    });

    expect(mockedAxios.post).not.toHaveBeenCalledWith(
      "/api/likeCourse/course-123"
    );
  });

  test("rolls back optimistic like when API fails", async () => {
    (mockedAxios.post as unknown as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    renderComponent();

    const user = userEvent.setup();
    const likeButton = screen.getByRole("button", {
      name: "like-course",
    });

    await user.click(likeButton);

    await waitFor(() => {
      expect(mockSetUserCourseById).toHaveBeenCalledWith(
        "course-123",
        expect.objectContaining({
          isLiked: false,
        })
      );
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to like course");
  });
});

// --------------------------------------------------
// CART
// --------------------------------------------------
//To be complete, when cart is implemented
// describe("CourseIdPageComp - Cart", () => {
//   beforeEach(() => {
//     mockUser = {
//       _id: "user-1",
//       name: "Test User",
//       email: "test@example.com",
//     };

//     mockAuthState.authUser = mockUser;
//   });

//   test("fetches cart when authenticated user exists", async () => {
//     renderComponent();

//     await waitFor(() => {
//       expect(mockFetchCart).toHaveBeenCalled();
//     });
//   });

// //To be complete
//   // test("adds course to cart", async () => {
//   //   (mockedAxios.get as unknown as jest.Mock).mockImplementation(
//   //     (url: string) => {
//   //       if (url === "/api/users/me") {
//   //         return Promise.resolve({
//   //           data: {
//   //             user: mockUser,
//   //           },
//   //         });
//   //       }

//   //       if (url === "/api/cart/course-123") {
//   //         return Promise.resolve({
//   //           data: {
//   //             success: true,
//   //           },
//   //         });
//   //       }

//   //       return Promise.resolve({
//   //         data: {},
//   //       });
//   //     }
//   //   );

//   //   renderComponent();

//   //   await waitFor(() => {
//   //     expect(mockFetchCart).toHaveBeenCalled();
//   //   });
//   //   const addCartButton = await screen.findByRole("button", {
//   //     name: "add-to-cart",
//   //   });

//   //   await user.click(addCartButton);

//   //   await waitFor(() => {
//   //     expect(mockedAxios.post).toHaveBeenCalledWith("/api/cart/course-123");
//   //   });
//   // });

//   test("removes course from cart", async () => {
//     mockCartState.cart = {
//       courses: [course] as unknown as CCourse[],
//     };

//     renderComponent();

//     const removeButton = await screen.findByRole("button", {
//       name: "remove-from-cart",
//     });

//     await user.click(removeButton);

//     await waitFor(() => {
//       expect(mockedAxios.delete).toHaveBeenCalledWith("/api/cart/course-123");
//     });
//   });
// });

// --------------------------------------------------
// LESSONS
// --------------------------------------------------

describe("CourseIdPageComp - Lessons", () => {
  test("renders course sections", () => {
    renderComponent();

    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
  });

  test("expands section and shows lessons", async () => {
    renderComponent();

    const expandButton = screen.getAllByRole("button", {
      name: "expand-section",
    })[0];

    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText("Introduction")).toBeInTheDocument();
      expect(screen.getByText("Variables")).toBeInTheDocument();
    });
  });
});

// --------------------------------------------------
// REVIEW
// --------------------------------------------------

const completedUserCourseStats = {
  ...userCourseStats,
  isEnrolled: true,
  isCompleted: true,
};
describe("CourseIdPageComp - Review", () => {
  beforeEach(() => {
    mockUser = {
      _id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    mockAuthState.authUser = mockUser;
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });
  });

  test("renders review form for authenticated user", () => {
    renderComponent({
      userCourseStats: completedUserCourseStats,
      uProgress: {
        currentProgress: {
          percentageCompleted: 100,
        },
        lessons: [],
      },
    });

    expect(screen.getByText("Add your review")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Type your review here.")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Submit Review",
      })
    ).toBeInTheDocument();
  });

  test("submits review successfully", async () => {
    const user = {
      _id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    mockUser = user;

    mockAuthState.authUser = user;

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });

    renderComponent({
      uProgress: {
        currentProgress: {
          percentageCompleted: 100,
        },
        lessons: [],
      },
    });

    (mockedAxios.post as unknown as jest.Mock).mockResolvedValue({
      data: {
        newReview: {
          rating: 5,
          comment: "Amazing course",
        },
      },
    });

    const textarea = screen.getByPlaceholderText("Type your review here.");

    fireEvent.change(textarea, {
      target: {
        value: "Amazing course",
      },
    });

    const stars = screen.getAllByTestId("review-star");

    fireEvent.click(stars[4]);

    fireEvent.submit(
      screen.getByRole("button", {
        name: "Submit Review",
      })
    );

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/courses/rate/course-123",
        {
          reviewData: {
            rating: expect.anything(),
            comment: "Amazing course",
          },
        }
      );
    });

    expect(toast.success).toHaveBeenCalledWith("Thanks for your review!");
  });

  test("shows error toast when review submission fails", async () => {
    (mockedAxios.post as unknown as jest.Mock).mockRejectedValue(
      new Error("Review failed")
    );

    renderComponent({
      uProgress: {
        currentProgress: {
          percentageCompleted: 100,
        },
        lessons: [],
      },
    });

    const textarea = screen.getByPlaceholderText("Type your review here.");

    fireEvent.change(textarea, {
      target: {
        value: "Bad experience",
      },
    });

    const stars = screen.getAllByTestId("review-star");

    await user.click(stars[4]);

    fireEvent.submit(
      screen.getByRole("button", {
        name: "Submit Review",
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong!, Please try again later"
      );
    });
  });
});

// --------------------------------------------------
// PROGRESS
// --------------------------------------------------

describe("CourseIdPageComp - User Progress Store", () => {
  test("fetches user course & lessons progress when courseId exists", async () => {
    renderComponent();
    await waitFor(() => {
      expect(mockFetchCourseProgress).toHaveBeenCalledWith("course-123");
    });
  });

  test("checks lesson completion", async () => {
    mockAuthState.authUser = {
      _id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    mockIsLessonCompleted.mockReturnValue(true);

    renderComponent({
      uProgress: {
        currentProgress: {
          percentageCompleted: 100,
        },
        lessons: [
          {
            _id: "lesson-1",
            isCompleted: true,
          },
        ],
      },
    });
    // const expandButtons = screen.getAllByRole("button", {
    //   name: "expand-section",
    // });

    // await user.click(expandButtons[0]);

    await waitFor(() => {
      expect(mockIsLessonCompleted).toHaveBeenCalledWith(
        "course-123",
        "lesson-1"
      );
    });
  });
});

// --------------------------------------------------
// CERTIFICATE
// --------------------------------------------------

describe("CourseIdPageComp - Certificate", () => {
  beforeEach(() => {
    mockUser = {
      _id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    mockAuthState.authUser = mockUser;
  });

  test("shows certificate button when course is completed", async () => {
    mockUserCourseState.userCourseByCourseId = {
      "course-123": {
        isLiked: false,
        isEnrolled: true,
        isCompleted: true,
      },
    };

    renderComponent({
      userCourseStats: {
        ...userCourseStats,
        isEnrolled: true,
        isCompleted: true,
      },
      uProgress: {
        currentProgress: {
          percentageCompleted: 100,
        },
        lessons: [],
      },
    });

    expect(
      await screen.findByRole("button", {
        name: /Download Certificate/i,
      })
    ).toBeInTheDocument();
  });

  test("downloads certificate successfully", async () => {
    const mockBlob = new Blob(["pdf"], { type: "application/pdf" });

    mockedAxios.get.mockResolvedValue({
      data: mockBlob,
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURL = jest.fn(() => "blob:mock-url");
    const revokeObjectURL = jest.fn();

    Object.defineProperty(window.URL, "createObjectURL", {
      writable: true,
      value: createObjectURL,
    });

    Object.defineProperty(window.URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectURL,
    });

    renderComponent({
      userCourseStats: {
        ...userCourseStats,
        isEnrolled: true,
        isCompleted: true,
      },
      uProgress: {
        currentProgress: {
          percentageCompleted: 100,
        },
        lessons: [],
      },
    });

    const button = await screen.findByRole("button", {
      name: /download certificate/i,
    });

    await user.click(button);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/api/certificate/course-123",
        {
          responseType: "blob",
        }
      );
    });

    expect(createObjectURL).toHaveBeenCalledWith(mockBlob);

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});

// --------------------------------------------------
// USER FETCH
// --------------------------------------------------

describe("CourseIdPageComp - User", () => {
  test("fetches current user on mount", async () => {
    (mockedAxios.get as unknown as jest.Mock).mockResolvedValue({
      data: {
        user: {
          _id: "user-1",
          name: "Test User",
          email: "test@example.com",
        },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/users/me");
    });

    await waitFor(() => {
      expect(mockSetAuthUser).toHaveBeenCalledWith({
        _id: "user-1",
        name: "Test User",
        email: "test@example.com",
      });
    });
  });
});
