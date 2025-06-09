"use client";

import React, { useCallback } from "react";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import { CampaignVisitorsChart } from "@/app/components/admin/Charts/campaign-visitors/chart";
import { CampaignVisitors } from "@/app/components/admin/Charts/campaign-visitors";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCourseStore } from "@/lib/store/useCourseStore";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { LuEyeClosed } from "react-icons/lu";
import { PiEyes } from "react-icons/pi";
import { IoSearch } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { CiEdit } from "react-icons/ci";
import axios from "axios";
import { toast } from "sonner";
import { IoMdSchool } from "react-icons/io";
import { validateEmail, validatePhoneNumber } from "@/utils/validators";
import { GiMoneyStack } from "react-icons/gi";
import { PiStudentFill } from "react-icons/pi";
import { MdCalendarMonth } from "react-icons/md";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingBarLoader from "@/app/components/shared/LoadingBarLoader";

const page = () => {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [coursesByInstructor, setCoursesByInstructor] = useState([]);
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const clearAuthUser = useAuthStore((state) => state.clearAuthUser);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalStudentsEnrolled, setTotalStudentsEnrolled] = useState([]);

  const [totalStudentsEnrolledThisMonth, setTotalStudentsEnrolledThisMonth] =
    useState([]);
  const [totalRevenueThisMonth, setTotalRevenueThisMonth] = useState(0);
  const [studentsEnrolled, setStudentsEnrolled] = useState([]);
  const [totalChatRevenueThisMonth, setTotalChatRevenueThisMonth] = useState(0);
  const [totalChatRevenueThisWeek, setTotalChatRevenueThisWeek] = useState(0);
  const [totalChatRevenue, setTotalChatRevenue] = useState(0);
  const [totalChatRevenueLastMonth, setTotalChatRevenueLastMonth] = useState(0);
  const [totalChatRevenueToday, setTotalChatRevenueToday] = useState(0);
  const [payments, setPayments] = useState([]);
  const [countRecords, setCountRecords] = useState(10);

  // console.log("📊 useAuthRedirect returned:", isAuthChecked);

  // console.log("Auth verified, rendering main content");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState("students");
  const filteredEnrolledStudents =
    searchTerm.trim() === ""
      ? studentsEnrolled
      : studentsEnrolled.filter((user) => {
          const id = user._id || "";
          const username = user.name?.toLowerCase() || "";
          const email = user.email?.toLowerCase() || "";
          const number = user.phoneNumber || "";
          const instructorName = user.instructor?.name?.toLowerCase() || "";
          const term = searchTerm.toLowerCase();

          return (
            id.includes(term) ||
            username.includes(term) ||
            email.includes(term) ||
            number.includes(term) ||
            instructorName.includes(term)
          );
        });
  const filteredPayments =
    searchTerm.trim() === ""
      ? payments
      : payments?.filter((payment) => {
          const id = payment?.paymentId || "";
          const amount = String(payment?.amount || "");
          const paymentDate = payment?.paymentAt || "";
          const paymentBy = payment?.paymentBy.toLowerCase() || "";
          const paymentReleatedTo = payment?.paymentOf || "";
          const term = searchTerm.toLowerCase();

          return (
            id.includes(term) ||
            amount.includes(term) ||
            paymentDate.includes(term) ||
            paymentBy.includes(term) ||
            paymentReleatedTo.includes(term)
          );
        });
  const filteredCourses =
    searchTerm.trim() === ""
      ? courses
      : courses.filter((course) => {
          const id = course._id || course.id || "";
          const courseName = course.title?.toLowerCase() || "";
          const instructorName = course?.instructor?.name?.toLowerCase() || "";
          const price = String(course?.price || "");
          const term = searchTerm.toLowerCase();

          return (
            id.includes(term) ||
            courseName.includes(term) ||
            price.includes(term) ||
            instructorName.includes(term)
          );
        });
  const getDetailsOfInstructor = () => {
    try {
      if (!authUser) return;

      const instructorCourses = courses.filter(
        (course) => course.instructor._id === authUser._id
      );

      setCoursesByInstructor(instructorCourses);

      const revenue = instructorCourses.reduce((sum, course) => {
        return sum + course.enrolledStudents?.length * course.price;
      }, 0);

      setTotalRevenue(revenue);
      const enrolledStudents = instructorCourses.reduce((sum, course) => {
        return sum + course.enrolledStudents?.length;
      }, 0);

      setTotalStudentsEnrolled(enrolledStudents);

      const revenueThisMonth = instructorCourses.reduce((sum, course) => {
        const createdAt = new Date(course.createdAt);
        const now = new Date();

        // Compare months and years
        const isThisMonth =
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear();

        if (isThisMonth) {
          return sum + course.enrolledStudents?.length * course.price;
        }

        return sum;
      }, 0); // ← this initial value is required

      setTotalRevenueThisMonth(revenueThisMonth);
      const allEnrolledStudents = instructorCourses.flatMap(
        (course) => course.enrolledStudents || []
      );

      setStudentsEnrolled(allEnrolledStudents);
      const now = new Date();
      const studentsThisMonth = instructorCourses.flatMap((course) =>
        (course.enrolledStudents || []).filter((entry) => {
          const date = new Date(entry.enrolledAt);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        })
      );

      setTotalStudentsEnrolledThisMonth(studentsThisMonth.length);
    } catch (error) {
      console.error("Failed to calculate instructor details", error);
    }
  };
  const getMyCourses = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/course/allCourses");
      console.log(response);
      setCourses(response.data.courses);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  function formatNumber(num) {
    if (num === null || num === undefined) return "0";

    if (num >= 1_000_000_000_000) {
      return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
    }
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }

    return num.toString();
  }
  const handleDeleteCourse = async (courseId) => {
    console.log("Delete course function called with this id ", courseId);
    try {
      const response = await axios.delete(`/api/admin/course/${courseId}`);
      console.log(response);
      toast.success("Course deleted successfully");
      getMyCourses();
    } catch (error) {
      console.log(error);
    }
  };
  const handleFetchChatStats = useCallback(async () => {
    try {
      const response = await axios.get(`/api/admin/chatStats`);
      const data = response?.data?.chats;
      console.log("These are the chat stats", data);
      let totalChatRevenue = data.reduce((acc, chat) => {
        const payments = chat.paymentsByUser || [];
        const chatRevenue = payments.reduce(
          (sum, payment) => sum + (Number(payment.amount) || 0),
          0
        );
        return acc + chatRevenue;
      }, 0);
      let totalChatRevenueThisMonth = data.reduce((acc, chat) => {
        const now = new Date();
        const createdAt = new Date(chat.createdAt);
        const payments = chat.paymentsByUser || [];

        const monthlyRevenue = payments.reduce((sum, payment) => {
          // Check if payment has a date field
          const paymentDate =
            payment.paymentAt || payment.createdAt || payment.date;
          if (paymentDate) {
            const paidAt = new Date(paymentDate);
            const isThisMonth =
              paidAt.getMonth() === now.getMonth() &&
              paidAt.getFullYear() === now.getFullYear();

            if (isThisMonth) {
              return sum + (Number(payment.amount) || 0);
            }
          }
          return sum;
        }, 0);
        return acc + monthlyRevenue;
      }, 0);
      let totalChatRevenueThisWeek = data.reduce((acc, chat) => {
        const payments = chat.paymentsByUser || [];
        let weeklyRevenue = payments.reduce((sum, payment) => {
          const paymentDate =
            payment.paymentAt || payment.createdAt || payment.date;
          if (paymentDate) {
            const now = new Date();
            const createdAt = new Date(paymentDate);
            const oneWeekAgo = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            const thisWeek = createdAt >= oneWeekAgo && createdAt <= now;
            if (thisWeek) {
              return sum + (Number(payment.amount) || 0);
            }
          }
          return sum;
        }, 0);

        return acc + weeklyRevenue;
      }, 0);

      let totalChatRevenueToday = data.reduce((acc, chat) => {
        const payments = chat.paymentsByUser || [];
        const todaysRevenue = payments.reduce((sum, payment) => {
          const paymentDate =
            payment.paymentAt || payment.createdAt || payment.date;
          if (paymentDate) {
            const now = new Date();
            const createdAt = new Date(paymentDate);
            const isToday =
              createdAt.getDate() === now.getDate() &&
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getFullYear() === now.getFullYear();
            if (isToday) {
              return sum + (Number(payment.amount) || 0);
            }
          }
          return sum;
        }, 0);

        return acc + todaysRevenue;
      }, 0);

      let totalChatRevenueLastMonth = data.reduce((acc, chat) => {
        const now = new Date();
        const createdAt = new Date(chat.createdAt);
        let lastMonth = now.getMonth() - 1;
        let lastMonthYear = now.getFullYear();

        // Handle January (month 0) - last month would be December (month 11) of previous year
        if (lastMonth < 0) {
          lastMonth = 11; // December
          lastMonthYear = now.getFullYear() - 1;
        }

        const isLastMonth =
          createdAt.getMonth() === lastMonth &&
          createdAt.getFullYear() === lastMonthYear;

        if (isLastMonth) {
          const payments = chat.paymentsByUser || [];
          const lastMonthRevenue = payments.reduce(
            (sum, payment) => sum + (Number(payment.amount) || 0),
            0
          );
          return acc + lastMonthRevenue;
        }
        return acc;
      }, 0);
      setTotalChatRevenueLastMonth(totalChatRevenueLastMonth);
      setTotalChatRevenue(totalChatRevenue);
      setTotalChatRevenueThisMonth(totalChatRevenueThisMonth);
      setTotalChatRevenueThisWeek(totalChatRevenueThisWeek);
      setTotalChatRevenueToday(totalChatRevenueToday);
      console.log("This is the total chat revenue", totalChatRevenue);
      console.log(
        "This is the total Chat Revenue Last Month",
        totalChatRevenueLastMonth
      );
      console.log(
        "This is the total Chat revenue this month",
        totalChatRevenueThisMonth
      );
      console.log(
        "This is the total Chat revenue this week",
        totalChatRevenueThisWeek
      );
      console.log(
        "This is the total Chat revenue today",
        totalChatRevenueToday
      );
    } catch (error) {
      throw error;
    }
  }, [
    authUser,
    totalChatRevenue,
    totalChatRevenueLastMonth,
    totalChatRevenueThisWeek,
    totalChatRevenueToday,
    totalChatRevenueThisMonth,
  ]);

  const handleFetchAllPayments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/admin/allPayments`);
      const data = response?.data?.payments;
      setPayments(data);
      console.log("This is the data of all the payments", data);
    } catch (error) {
      console.log("This is the error on the console page :", error);
      throw error;
    }
  }, [authUser]);
  useEffect(() => {
    const timer = setTimeout(() => {
      getMyCourses();
    }, 300); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [getMyCourses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getDetailsOfInstructor();
    }, 350); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [courses]);
  useEffect(() => {
    console.log("These are the courses", courses);
  }, [courses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetchChatStats();
      handleFetchAllPayments();
    }, 400); // Small delay to prevent immediate load
    return () => clearTimeout(timer);
  }, [handleFetchChatStats, handleFetchAllPayments]);

  const isAuthChecked = useAuthRedirect({
    redirectIfUnauthenticated: true,
    redirectIfAuthenticated: false,
    redirectIfNotInstructor: true,
    interval: 3000,
  });

  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center py-6 relative">
      {loading && (
        <div className="w-full relative">
          <LoadingBarLoader isLoading={loading} />
        </div>
      )}
      <div className="w-[90%] lg:w-[70%] flex flex-col items-center justify-start">
        <div className="w-full h-auto flex flex-col items-center justify-start gap-6 p-6 pt-2">
          <div className="w-full flex items-center justify-start text-4xl font-semibold">
            <p className="text-4xl">Dashboard</p>
          </div>
          <div className="w-full  grid grid-cols-1 lg:grid-cols-4 gap-4 justify-items-center">
            <div className="w-full ">
              <Card className="!w-full !lg:w-[300px] h-[200px] lg:h-[240px] overflow-hidden">
                <CardContent className="h-full">
                  <div className="flex flex-col h-full gap-6 justify-between">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold">
                        Total Courses
                      </span>
                      <span className="text-4xl font-semibold">
                        <IoMdSchool />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      {coursesByInstructor?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full ">
              <Card className="!w-full !lg:w-[300px] h-[200px] lg:h-[240px]">
                <CardContent className="h-full">
                  <div className="flex flex-col gap-6 justify-between  h-full">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold">
                        Total Revenue
                      </span>
                      <span className="text-4xl font-semibold">
                        <GiMoneyStack />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      ₹{formatNumber(totalRevenue) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full ">
              <Card className="!w-full !lg:w-[300px] h-[200px] lg:h-[240px]">
                <CardContent className="h-full">
                  <div className="flex flex-col gap-6 justify-between  h-full">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold leading-tight whitespace-normal break-words">
                        Total Students Enrolled
                      </span>
                      <span className="text-4xl font-semibold">
                        <PiStudentFill />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      {totalStudentsEnrolled || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full ">
              <Card className="!w-full !lg:w-[300px] h-[200px] lg:h-[240px]">
                <CardContent className="h-full">
                  <div className="flex flex-col gap-6 justify-between  h-full">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold leading-tight whitespace-normal break-words">
                        Total Revenue this Month
                      </span>
                      <span className="text-4xl font-semibold">
                        <MdCalendarMonth />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      ₹ {formatNumber(totalRevenueThisMonth) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full ">
              <Card className="!w-full  !lg:w-[300px] h-[200px] lg:h-[240px]">
                <CardContent className="h-full">
                  <div className="flex flex-col gap-6 justify-between  h-full">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold leading-tight whitespace-normal break-words">
                        Total Chat Revenue this Month
                      </span>
                      <span className="text-4xl font-semibold">
                        <MdCalendarMonth />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      ₹ {formatNumber(totalChatRevenueThisMonth) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-full ">
              <Card className="!w-full !lg:w-[300px] h-[200px] lg:h-[240px]">
                <CardContent className="h-full">
                  <div className="flex flex-col gap-6 justify-between  h-full">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold leading-tight whitespace-normal break-words">
                        Total Chat Revenue this Week
                      </span>
                      <span className="text-4xl font-semibold">
                        <MdCalendarMonth />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      ₹ {formatNumber(totalChatRevenueThisWeek) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full ">
              <Card className="!w-full !lg:w-[300px] h-[200px] lg:h-[240px]">
                <CardContent className="h-full">
                  <div className="flex flex-col gap-6 justify-between  h-full">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold leading-tight whitespace-normal break-words">
                        Total Chat Revenue Last Month
                      </span>
                      <span className="text-4xl font-semibold">
                        <MdCalendarMonth />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      ₹ {formatNumber(totalChatRevenueLastMonth) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full ">
              <Card className="!w-full !lg:w-[300px] h-[200px] lg:h-[240px]">
                <CardContent className="h-full">
                  <div className="flex flex-col gap-6 justify-between  h-full">
                    <span className="flex gap-5 items-center justify-between lg:justify-start">
                      <span className="text-3xl md:text-xl font-semibold leading-tight whitespace-normal break-words">
                        Total Chat Revenue
                      </span>
                      <span className="text-4xl font-semibold">
                        <MdCalendarMonth />
                      </span>
                    </span>
                    <span className="text-3xl font-bold">
                      ₹ {formatNumber(totalChatRevenue) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <Separator className="my-4 !w-[100%] h-px px-6" />
        </div>
        <div className="w-full h-auto flex flex-col items-center justify-start gap-6 p-6 pt-0">
          <div className="w-full flex flex-col lg:flex-row gap-4 items-center justify-between text-4xl font-semibold">
            <p className="text-4xl capitalize">All {selectedView}</p>

            <span className="relative">
              <Input
                type="text"
                placeholder="Search"
                className="w-full text-lg placeholder:text-lg placeholder:text-start placeholder:my-auto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <IoSearch className="absolute top-2 right-2 text-lg" />
            </span>
            <Select
              onValueChange={(value) => setSelectedView(value)}
              defaultValue={"students"}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Admin Views</SelectLabel>
                  <SelectItem value="students">students</SelectItem>
                  <SelectItem value="courses">courses</SelectItem>
                  <SelectItem value="payments">payments</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full flex justify-end items-center">
            <Select
              onValueChange={(value) => setCountRecords(value)}
              defaultValue={"10"}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Records" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Count Records</SelectLabel>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {selectedView === "students" && (
            <div className="w-full h-[500px] overflow-auto flex flex-col items-center justify-start gap-2 lg:p-6 pt-0">
              <div className="w-full grid grid-cols-5 bg-muted rounded-md px-6 py-4 text-center font-semibold">
                <div className="flex justify-start items-start">Image</div>
                <div className="flex justify-start items-start">Name</div>
                <div className="flex justify-start items-start">Role</div>
                <div className="flex justify-start items-start">Email</div>
                <div className="flex justify-start items-start">
                  ID / Phone Number
                </div>
              </div>
              {filteredEnrolledStudents?.length === 0 ? (
                <p className="text-muted-foreground text-lg">
                  {searchTerm.trim() === ""
                    ? "No students enrolled yet."
                    : `No students found for "${searchTerm}"`}
                </p>
              ) : (
                filteredEnrolledStudents?.slice(0, countRecords).map((user) => (
                  <Card key={user._id || user.id} className="w-full h-[80px]">
                    <CardContent>
                      <div className="w-full grid grid-cols-5 px-2 text-center font-semibold">
                        <Avatar>
                          <AvatarImage
                            src={
                              user?.user?.profileImage ||
                              "https://github.com/shadcn.png"
                            }
                          />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div className="flex justify-start items-start">
                          {user?.user?.name}
                        </div>
                        <div className="capitalize flex justify-start items-start">
                          {user?.user?.role}
                        </div>
                        <div className="flex justify-start items-start">
                          {user?.user?.email}
                        </div>
                        <div className="flex justify-start items-start">
                          {user?.user?.phoneNumber || user.user._id}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {selectedView === "courses" && (
            <div className="w-full h-[500px] overflow-auto flex flex-col items-center justify-start gap-2 p-6 pt-0">
              {(filteredCourses.slice(0, countRecords) || []).map((course) => (
                <Card key={course._id} className="w-full h-auto">
                  <CardContent>
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <span className="text-xl font-semibold">
                          {course.title}
                        </span>
                        <span>Instructor: {course.instructor?.name}</span>
                        <span>Price: ₹{course.price}</span>
                        <span>
                          Enrolled Students:{" "}
                          {course.enrolledStudents?.length || 0}
                        </span>
                      </div>
                      {course && (
                        <div className="flex h-full items-center justify-center">
                          <div className="w-[100px] h-[90%] relative">
                            <Image
                              src={course?.coverImage}
                              fill
                              alt={course?.title}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedView === "payments" && (
            <div className="w-full h-[500px] overflow-auto flex flex-col items-center justify-start gap-2 p-6 pt-0">
              <div className="w-full grid grid-cols-4 bg-muted rounded-md px-6 py-4 text-center font-semibold">
                <div className="flex justify-center items-start">Id</div>
                <div className="flex justify-center items-start">Amount</div>
                <div className="flex justify-center items-start">Date</div>

                <div className="flex justify-center items-start">
                  Payment For
                </div>
              </div>
              {/* Assuming you have payment data, otherwise show a placeholder */}
              {filteredPayments?.length === 0 ? (
                <p className="text-lg text-muted-foreground">
                  Payment view coming soon...
                </p>
              ) : (
                (filteredPayments.slice(0, countRecords) || []).map(
                  (payment) => (
                    <Card key={payment._id} className="w-full h-[80px]">
                      <CardContent>
                        <div className="w-full grid grid-cols-4 px-2 text-center font-semibold">
                          <div>{payment?.paymentId}</div>
                          <div className="">{Number(payment?.amount)}</div>
                          <div>
                            {new Date(payment?.paymentAt).toLocaleString(
                              "en-US"
                            )}
                          </div>
                          <div>{payment?.paymentOnModel}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default page;
