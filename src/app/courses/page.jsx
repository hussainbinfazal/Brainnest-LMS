"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaGraduationCap } from "react-icons/fa6";
import { FaRegHeart } from "react-icons/fa";
import axios from "axios";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { CircleUser } from "lucide-react";
import { SlBadge } from "react-icons/sl";
import { IoMdHeart } from "react-icons/io";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearch } from "react-icons/io5";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BarLoader, ClipLoader } from "react-spinners";
import { BiSolidCategoryAlt } from "react-icons/bi";
import LoadingBarLoader from "../components/shared/LoadingBarLoader";

const page = () => {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState({});
  const [languages, setLanguages] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedsubCategories, setSelectedsubCategories] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [likedCourseIds, setLikedCourseIds] = useState([]);
  const [closeSidebar, setCloseSidebar] = useState(false);
  const itemsPerPage = 6; // You can customize this
  const user = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const [sidebarItems, setSidebarItems] = [
    {
      title: "Categories",
      items: [
        {
          title: "Design",
        },
        {
          title: "Development",
        },
        {
          title: "Marketing",
        },
      ],
    },
    {
      language: [
        {
          title: "English",
        },
        {
          title: "Hindi",
        },
      ],
    },
    {
      level: [
        {
          title: "Beginner",
        },
        {
          title: "Intermediate",
        },
        {
          title: "Advanced",
        },
      ],
    },
  ];

  const fetchAllCourses = useCallback(async () => {

    try {
      const response = await axios.get(
        `/api/courses?page=${page}&limit=${itemsPerPage}`
      );
      const {
        data,
        currentPage,
        totalPages,
        totalCourses,
        hasNextPage,
        hasPrevPage,
      } = response?.data;
      setCourses(data);
      extractSidebarItems(data);
      setCurrentPage(currentPage);
      setTotalPages(totalPages);
      setTotalCourses(totalCourses);
      setHasNextPage(hasNextPage);
      setHasPrevPage(hasPrevPage);
      setIsLoading(false);
    } catch (error) {
      throw error;
    } finally {
    }
  }, [page, itemsPerPage]);
  const extractSidebarItems = (courses) => {
    const map = {};
    const languageSet = new Set();
    const levelSet = new Set();

    courses.forEach((course) => {
      const category = course.category.name;
      const subCategories = course.category.subCategories || [];
      const language = course.language;
      const level = course.level;

      if (!map[category]) {
        map[category] = new Set();
      }

      subCategories.forEach((sub) => {
        map[category].add(sub);
      });
      if (language) {
        languageSet.add(language);
      }

      if (level) {
        levelSet.add(level);
      }
    });

    const categoryMap = Object.entries(map).reduce((acc, [cat, subs]) => {
      acc[cat] = Array.from(subs);
      return acc;
    }, {});

    setCategories(categoryMap);
    setLanguages(Array.from(languageSet));
    setLevels(Array.from(levelSet));
  };

  function convertToTotalHours(timeStr) {
    const parts = timeStr.toString().split(":").map(Number);

    let hours = 0;
    if (parts.length === 3) {
      hours = parts[0] + parts[1] / 60 + parts[2] / 3600;
    } else if (parts.length === 2) {
      hours = parts[0] / 60 + parts[1] / 3600;
    } else if (parts.length === 1) {
      hours = parts[0] / 3600;
    }

    return parseFloat(hours.toFixed(2)); // rounded to 2 decimals
  }
  function formatRatingNumber(num) {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    } else {
      return num.toString();
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllCourses();
    }, 300); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [fetchAllCourses]);

  const handleCheckboxChange = (value, type) => {
    const updateSelected = (selected, setter) => {
      if (selected.includes(value)) {
        setter(selected.filter((v) => v !== value));
      } else {
        setter([...selected, value]);
      }
    };

    if (type === "subCategories")
      updateSelected(selectedsubCategories, setSelectedsubCategories);
    if (type === "languages") {
      updateSelected(selectedLanguages, setSelectedLanguages);
    }
    if (type === "levels") {
      updateSelected(selectedLevels, setSelectedLevels);
    }
  };
  useEffect(() => {
    const filtered = courses.filter((course) => {
      const matchesSubcategory =
        selectedsubCategories?.length === 0 ||
        course?.category?.subCategories?.some((sub) =>
          selectedsubCategories?.includes(sub)
        );

      const matchesLanguage =
        selectedLanguages?.length === 0 ||
        selectedLanguages?.includes(course?.language);

      const matchesLevel =
        selectedLevels?.length === 0 || selectedLevels?.includes(course?.level);

      return matchesSubcategory && matchesLanguage && matchesLevel;
    });

    setFilteredCourses(filtered);
  }, [selectedsubCategories, selectedLanguages, selectedLevels, courses]);
  useEffect(() => {
  }, [selectedLanguages]);

  useEffect(() => {
  }, [selectedsubCategories]);
  useEffect(() => {
    if (user?.likedCourses) {
      setLikedCourseIds(user.likedCourses);
    }
  }, [user]);

  const likeCourse = async (courseId) => {
    if (!user) {
      return alert("Please login first");
    }
    // params mai user id pass karni   hai
    try {
      if (!courseId) return alert("Error");
      const reponse = await axios.post(`/api/likeCourse/${courseId}`);
      fetchUser();
      setLikedCourseIds([...likedCourseIds, courseId]);
      toast.success("Course liked! You'll find it in your Liked Courses.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong while liking the course.";

      toast.error(message);
    }
  };

  const unlikeCourse = async (courseId) => {
    if (!user) {
      return alert("Please login first");
    }
    // params mai user id pass karni   hai
    try {
      if (!courseId) return alert("Error");
      const reponse = await axios.delete(`/api/dislikeCourse/${courseId}`);
      fetchUser();
      setLikedCourseIds(likedCourseIds.filter((id) => id !== courseId));
      toast.success("Course Disliked!");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong while liking the course.";
      toast.error(message);
    }
  };
  const fetchUser = async () => {
    const response = await axios("/api/users/me");
    if (response.data.user) {
      setAuthUser(response.data.user);
    }
  };

  const searchedCourses =
    searchTerm.trim() === ""
      ? filteredCourses
      : courses.filter((course) => {
          const title = course.title?.toLowerCase() || "";
          const instructorName = course.instructor?.name?.toLowerCase() || "";
          const term = searchTerm.toLowerCase();

          return title.includes(term) || instructorName.includes(term);
        });

  const maxVisiblePages = 4; // Number of visible page buttons

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };
 
  return (
    <div className="w-screen min-h-screen h-screen flex flex-col relative overflow-hidden">
      {isLoading && (
        <div className="w-full relative">
          <LoadingBarLoader isLoading={isLoading} />
        </div>
      )}
      <div className="w-full h-full flex flex-row gap-6 relative bg-black">
        {isLoading ? (
          <Skeleton className="w-[235px] min-h-screen" />
        ) : (
          <div
            className={`min-h-screen !h-full ${
              closeSidebar ? "w-[70px]" : "w-[250px]"
            }  border-r flex flex-col gap-4 relative z-10 md:z-0 left-0 top-0 md:relative dark:bg-black bg-white overflow-y-auto`}
          >
            <div className="min-h-screen h-full flex flex-col relative gap-4">
              <div className="min-h-screen h-full flex flex-col relative ">
                <span
                  className="text-3xl text-white pl-4 pt-6"
                  onClick={() => {
                    setCloseSidebar(!closeSidebar);
                  }}
                >
                  <BiSolidCategoryAlt className="cursor-pointer dark:text-white text-black" />
                </span>
                {/* <SidebarHeader className="pl-6">
                  <p>
                    {" "}
                    <FaGraduationCap className="text-3xl " />
                  </p>
                </SidebarHeader> */}
                {!closeSidebar && (
                  <div className="pl-4 h-full flex flex-col gap-4">
                    <div
                      title="Categories"
                      className="flex flex-col justify-center gap-3"
                    >
                      <p className="mt-3 mb-3 text-xl">Categories</p>
                      {Object.entries(categories).map(([category, subcats]) => (
                        <div key={category} className="flex flex-col gap-2">
                          <p className="font-semibold pl-0">
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </p>
                          <div className="pl-0 space-y-3 mt-1 ">
                            {subcats.map((sub) => (
                              <div className="flex gap-3 items-center">
                                <input
                                  type="checkbox"
                                  value={sub}
                                  className="mr-2 appearance-none w-3 h-3 rounded-full border border-gray-400 checked:bg-blue-500"
                                  checked={selectedsubCategories.includes(sub)}
                                  onChange={() =>
                                    handleCheckboxChange(sub, "subCategories")
                                  }
                                />
                                {sub.charAt(0).toUpperCase() + sub.slice(1)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      title="Languages"
                      className="flex flex-col justify-center gap-3"
                    >
                      <p>Languages</p>
                      {languages.map((lang) => (
                        <div className="flex gap-3 items-center">
                          <input
                            type="checkbox"
                            value={lang}
                            className="mr-2 appearance-none w-3 h-3 rounded-full border border-gray-400 checked:bg-blue-500"
                            checked={selectedLanguages.includes(lang)}
                            onChange={() =>
                              handleCheckboxChange(lang, "languages")
                            }
                          />
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </div>
                      ))}
                    </div>

                    <div
                      title="Levels"
                      className="flex flex-col justify-center gap-3"
                    >
                      <p>Levels</p>
                      {levels.map((level) => (
                        <div className="flex gap-3 items-center">
                          <input
                            type="checkbox"
                            value={level}
                            className="mr-2 appearance-none w-3 h-3 rounded-full border border-gray-400 checked:bg-blue-500"
                            checked={selectedLevels.includes(level)}
                            onChange={() =>
                              handleCheckboxChange(level, "levels")
                            }
                          />
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div />
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <Skeleton className="w-full h-screen" />
        ) : (
          <div
            className={`${
              closeSidebar ? "w-[calc(100%-70px)]" : "w-[calc(100%-250px)]"
            } md:w-2/3 min-h-screen h-full flex flex-col gap-2 justify-between pt-4 overflow-auto`}
          >
            <span className="w-full flex justify-between items-center">
              <span className="inline-block text-3xl">Courses</span>
              <span className="relative">
                <Input
                  type="text"
                  placeholder="Search"
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="absolute top-2 right-2" />
              </span>
            </span>
            <div className="w-full flex-1 flex items-start justify-start">
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4 justify-items-center">
                {searchedCourses?.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-lg">
                      {searchTerm.trim() === ""
                        ? "No course found yet."
                        : `No course found for "${searchTerm}"`}
                    </p>
                  </div>
                ) : (
                  searchedCourses.map((course) => {
                    return (
                      <Card
                        key={course?._id}
                        className="w-[300px] h-[380px] relative"
                      >
                        <CardContent className="h-3/5 w-full flex justify-center relative">
                          {course?.coverImage ? (
                            <div className="relative w-full h-full p-4 rounded-xl overflow-hidden">
                              <Image
                                src={course.coverImage}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <Skeleton className="w-full h-[200px]" />
                          )}
                        </CardContent>
                        <CardFooter className="flex-1">
                          <div className="w-full h-full flex flex-col justify-between gap-3">
                            <div className="w-full flex flex-col flex-1 gap-2">
                              <p className="capitalize text-xl font-semibold  leading-snug overflow-hidden text-ellipsis whitespace-nowrap">
                                {course.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {course?.instructor?.name}
                              </p>
                              <div className="flex gap-2">
                                <Badge variant="outline">
                                  {course?.rating
                                    ? formatRatingNumber(course.rating)
                                    : "0"}
                                </Badge>
                                <Badge variant="outline">
                                  {course?.duration
                                    ? convertToTotalHours(course.duration)
                                    : "0"}{" "}
                                  hours
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full flex justify-between ">
                              {likedCourseIds.includes(course._id) ? (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    unlikeCourse(course._id);
                                  }}
                                  className="px-10"
                                >
                                  <span className="w-full flex justify-center">
                                    <IoMdHeart className="text-2xl text-red-500" />
                                  </span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    likeCourse(course._id);
                                  }}
                                  className="px-10"
                                >
                                  <span className="w-full flex justify-center">
                                    <FaRegHeart className="text-xl cursor-pointer" />
                                  </span>
                                </Button>
                              )}

                              <Button
                                onClick={() => {
                                  router.push(`/courses/${course._id}`);
                                }}
                                className="cursor-pointer"
                              >
                                View Course
                              </Button>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
            <div className="py-4">
              {isLoading ? (
                <Skeleton />
              ) : (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        isActive={hasPrevPage}
                        className={
                          !hasPrevPage ? "opacity-50 cursor-not-allowed" : ""
                        }
                      />
                    </PaginationItem>

                    {getVisiblePages().map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        isActive={hasNextPage}
                        className={
                          !hasNextPage ? "opacity-50 cursor-not-allowed" : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
