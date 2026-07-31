import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage, { HomeProps } from "./Homepage"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCourseStore } from "@/lib/store/useCourseStore";
import { toast } from "sonner";
import type { CCourse, CCategory, CReview } from "@/types/client";
import { CCategoryWithChildren } from "@/lib/getCachedCategory";

// ---------- Mocks ----------

// next/image: render a plain <img> so we can query it easily
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@/lib/store/useAuthStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("@/lib/store/useCourseStore", () => ({
  useCourseStore: jest.fn(),
}));

// embla-carousel-autoplay plugin — just needs to not crash
jest.mock("embla-carousel-autoplay", () => {
  return jest.fn(() => ({}));
});

// Carousel/Tabs from shadcn are real components (usually fine to render as-is,
// since they're mostly divs + context). If yours use ResizeObserver internally
// (embla does), stub it globally — see below.

// ---------- Shared fixtures ----------

const mockCategory = (overrides: Partial<CCategoryWithChildren> = {}): CCategoryWithChildren => ({
  _id: "cat-1",
  name: "Development",
  slug: "development",
  children: [],
  ...overrides,
} as unknown as CCategoryWithChildren);

const mockReview = (overrides: Partial<CReview> = {}): CReview => ({
  _id: "rev-1",
  rating: 5,
  comment: "Great course, learned a lot!",
  spamScore: 0,
  status: "clean",
  user: { name: "Alex" },
  ipAdress: "127.0.0.1",
  score: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const mockCourse = (overrides: Partial<CCourse> = {}): CCourse => ({
  _id: "course-1",
  title: "Intro to Testing",
  topic: "testing",
  description: "A short course about testing",
  coverImage: "/cover.png",
  instructorId: { _id: "inst-1", name: "Jane Doe" },
  averageRating: 4.5,
  totalDurationInSeconds: 3600,
  price: 999,
  isPaid: true,
  discount: 0,
  level: "beginner",
  language: "English",
  status: "published",
  topics: [],
  lessons: [],
  reviews: [mockReview()],
  category: mockCategory(),
  published: true,
  purchased: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const defaultProps: HomeProps = {
  initialCourses: [mockCourse()],
  fetchedReviews: [mockReview()],
  allCategories: [mockCategory()],
};

function setupStoreMocks(overrides: Partial<any> = {}) {
  (useCourseStore as unknown as jest.Mock).mockReturnValue({
    fetchCourses: jest.fn(),
    courses: [mockCourse()],
    setCourses: jest.fn(),
    reviews: [mockReview()],
    categories: [mockCategory()],
    ...overrides,
  });

  (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({
      saveUserGeography: jest.fn().mockResolvedValue(undefined),
      authUser: null,
      setAuthUser: jest.fn(),
      userLocation: { country_name: "India" },
    })
  );
}

beforeAll(() => {
  // embla-carousel measures elements via ResizeObserver — jsdom doesn't have it
  (global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  (useSession as jest.Mock).mockReturnValue({ data: null, status: "unauthenticated" });
  setupStoreMocks();
  window.sessionStorage.clear();
});

// ---------- Tests ----------

describe("HomePage", () => {
  it("renders the generic welcome heading when there is no session", () => {
    render(<HomePage {...defaultProps} />);
    expect(
      screen.getByRole("heading", {
        name: /welcome to.*brainnest where education is a game/i,
      })
    ).toBeInTheDocument();
  });

  it("renders a personalized welcome heading using the user's first name when logged in", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "John Smith" } },
      status: "authenticated",
    });

    render(<HomePage {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /john, welcome to.*brainnest/i })
    ).toBeInTheDocument();
  });

  it("uses the middle name when the user's full name has three parts", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "John Michael Smith" } },
      status: "authenticated",
    });

    render(<HomePage {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /michael, welcome to.*brainnest/i })
    ).toBeInTheDocument();
  });

  it("renders course cards from the courses store", () => {
    render(<HomePage {...defaultProps} />);
    expect(screen.getAllByText("Intro to Testing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
  });

  it("renders category tabs when categories are present", () => {
    setupStoreMocks({ categories: [mockCategory({ name: "Design" })] });
    render(<HomePage {...defaultProps} />);
    expect(screen.getByRole("tab", { name: /design/i })).toBeInTheDocument();
  });

  it("navigates to /courses when 'All Career Accelerators' is clicked", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    const user = userEvent.setup();

    render(<HomePage {...defaultProps} />);
    await user.click(
      screen.getByRole("button", { name: /all career accelerators/i })
    );

    expect(push).toHaveBeenCalledWith("courses");
  });

  it("shows a success toast and clears sessionStorage after OAuth login redirect", () => {
    window.sessionStorage.setItem("justLoggedIn", "true");

    render(<HomePage {...defaultProps} />);

    expect(toast.success).toHaveBeenCalledWith("Login successful");
    expect(window.sessionStorage.getItem("justLoggedIn")).toBeNull();
  });

  it("does not show a login toast when the flag is absent", () => {
    render(<HomePage {...defaultProps} />);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("renders review cards from the reviews store", () => {
    setupStoreMocks({ reviews: [mockReview({ comment: "Loved it!" })] });
    render(<HomePage {...defaultProps} />);
    expect(screen.getByText("Loved it!")).toBeInTheDocument();
  });

  it("renders the user's country in the 'Learn from popular categories' heading once location loads", async () => {
    render(<HomePage {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByText(/learn from popular categories in India/i)
      ).toBeInTheDocument();
    });
  });

  it("falls back to empty course/category/review lists gracefully", () => {
    setupStoreMocks({ courses: [], categories: [], reviews: [] });
    render(
      <HomePage initialCourses={[]} fetchedReviews={[]} allCategories={[]} />
    );
    // Should render skeletons/placeholders instead of crashing
    expect(
      screen.getByRole("heading", { name: /welcome to/i })
    ).toBeInTheDocument();
  });
});