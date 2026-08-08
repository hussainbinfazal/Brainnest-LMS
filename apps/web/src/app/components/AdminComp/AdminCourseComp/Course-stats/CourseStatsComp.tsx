"use client";

import React, { useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import Link from "next/link";
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
import { validateEmail, validatePhoneNumber } from "@/utils/phoneValidators";
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
import { CChat, CCourse, CEnrolledStudent, CPayment } from "@/types/client";
import Error from "next/error";
import { cn } from "@/lib/utils";


interface PaymentsResponse {

}
//Do all the complex calculation on servver then pass those data to the component as props
export const CourseStatsComp: React.FC<{ className?: string }> = ({ className }): React.JSX.Element => {
  const router = useRouter();
  const [courses, setCourses] = useState<CCourse[]>([]);
  const [coursesByInstructor, setCoursesByInstructor] = useState<CCourse[]>([]);
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const clearAuthUser = useAuthStore((state) => state.clearAuthUser);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [totalStudentsEnrolled, setTotalStudentsEnrolled] = useState<number>(0);

  const [totalStudentsEnrolledThisMonth, setTotalStudentsEnrolledThisMonth] =
    useState<number>(0);
  const [totalRevenueThisMonth, setTotalRevenueThisMonth] = useState<number>(0);
  const [studentsEnrolled, setStudentsEnrolled] = useState<CEnrolledStudent[]>([]);
  const [totalChatRevenueThisMonth, setTotalChatRevenueThisMonth] = useState<number>(0);
  const [totalChatRevenueThisWeek, setTotalChatRevenueThisWeek] = useState<number>(0);
  const [totalChatRevenue, setTotalChatRevenue] = useState<number>(0);
  const [totalChatRevenueLastMonth, setTotalChatRevenueLastMonth] = useState<number>(0);
  const [totalChatRevenueToday, setTotalChatRevenueToday] = useState<number>(0);
  const [payments, setPayments] = useState<CPayment[]>([]);
  const [countRecords, setCountRecords] = useState<number>(10);


  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedView, setSelectedView] = useState<string>("students");
  const filteredEnrolledStudent: CEnrolledStudent[] =
    searchTerm!.trim() === ""
      ? studentsEnrolled
      : studentsEnrolled.filter((user: CEnrolledStudent) => {
        const id: string = user?._id || "";
        const username: string = user?.name?.toLowerCase() || "";
        const email: string = user.email?.toLowerCase() || "";
        const number: string = user.phoneNumber || "";
        const instructorName: string = user.instructor?.name?.toLowerCase() || "";

        const term: string | null | undefined = searchTerm?.toLowerCase();

        return (
          id.includes(term ?? "") ||
          username.includes(term ?? "") ||
          email.includes(term ?? "") ||
          number.includes(term ?? "") ||
          instructorName.includes(term ?? "")
        );
      });
  const filteredPayments: CPayment[] =
    searchTerm?.trim() === ""
      ? payments
      : payments?.filter((payment) => {
        const id: string = payment?.paymentId || "";
        const amount: string = String(payment?.amount || null);
        const paymentDate: Date | null = payment?.paymentAt || null;
        const paymentBy: string = typeof payment?.paymentBy === 'object' && payment.paymentBy?.name ? payment.paymentBy.name.toLowerCase() : "";
        const paymentReleatedTo = payment?.paymentOf || "";
        const term = searchTerm?.toLowerCase();

        return (
          id.includes(term ?? "") ||
          amount.includes(term ?? "") ||
          paymentDate?.toLocaleString().includes(term ?? "") ||
          paymentBy.includes(term ?? "") ||
          paymentReleatedTo.includes(term ?? "")
        );
      });
  const filteredCourses: CCourse[] =
    searchTerm?.trim() === ""
      ? courses
      : courses.filter((course: CCourse) => {
        const id: string = course._id || "";
        const courseName: string = course.title?.toLowerCase() || "";
        const instructorName: string = course?.instructor?.name?.toLowerCase() || "";
        const price: string = String(course?.price || "");
        const term: string | null | undefined = searchTerm?.toLowerCase();

        return (
          id.includes(term ?? "") ||
          courseName.includes(term ?? "") ||
          price.includes(term ?? " ") ||
          instructorName.includes(term ?? "")
        );
      });
  const getDetailsOfInstructor = (): void => {
    try {
      if (!authUser) return;

      const instructorCourses: CCourse[] = courses.filter(
        (course) => course?.instructor?._id === authUser._id
      );

      setCoursesByInstructor(instructorCourses);

      const revenue: number = instructorCourses.reduce((sum: number, course: CCourse) => {
        const enrolledStudents: number = course.enrolledStudents?.length || 0;
        const price: number = course.price || 0;
        return sum + enrolledStudents * price;
      }, 0);

      setTotalRevenue(revenue);
      const enrolledStudents: number = instructorCourses.reduce((sum: number, course: CCourse) => {
        const enrolledCount: number = course.enrolledStudents?.length || 0;
        const price: number = course.price || 0;
        return sum + enrolledCount * price;
      }, 0);

      setTotalStudentsEnrolled(enrolledStudents);

      const revenueThisMonth: number = instructorCourses.reduce((sum: number, course: CCourse) => {
        const createdAt: Date = course?.createdAt ? new Date(course.createdAt) : new Date();
        const now: Date = new Date();

        // Compare months and years
        const isThisMonth: boolean =
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear();

        if (isThisMonth) {
          const enrolledStudentsCount: number = course.enrolledStudents?.length || 0;
          const price: number = course.price || 0;
          return sum + enrolledStudentsCount * price;
        }

        return sum;
      }, 0); // ← this initial value is required

      setTotalRevenueThisMonth(revenueThisMonth);
      const allEnrolledStudents: CEnrolledStudent[] = instructorCourses.flatMap(
        (course: CCourse) => course.enrolledStudents || []
      );

      setStudentsEnrolled(allEnrolledStudents);
      const now: Date = new Date();
      const studentsThisMonth: CEnrolledStudent[] = instructorCourses.flatMap((course: CCourse) =>
        (course.enrolledStudents || []).filter((entry: CEnrolledStudent) => {
          const date: Date = new Date(entry.enrolledAt);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        })
      );

      setTotalStudentsEnrolledThisMonth(studentsThisMonth.length);
    } catch (error: any) {
      console.error("Failed to calculate instructor details", error);
    }
  };
  const getMyCourses = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get("/api/admin/course/allCourses");
      console.log(response);
      setCourses(response.data.courses);
    } catch (error: any | Error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  function formatNumber(num: number | null | undefined): string {
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
  const handleDeleteCourse = async (courseId: string) => {
    console.log("Delete course function called with this id ", courseId);
    try {
      const response = await axios.delete(`/api/admin/course/${courseId}`);
      console.log(response);
      toast.success("Course deleted successfully");
      getMyCourses();
    } catch (error: any) {
      console.log(error);
    }
  };
  const handleFetchChatStats = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get(`/api/admin/chatStats`);
      const data: CChat[] = response?.data?.chats;
      console.log("These are the chat stats", data);
      let totalChatRevenue: number = data.reduce((acc: number, chat: CChat) => {
        const payments: CPayment[] = chat.paymentsByUser || [];
        const chatRevenue: number = payments.reduce(
          (sum: number, payment: CPayment) => sum + (Number(payment.amount) || 0),
          0
        );
        return acc + chatRevenue;
      }, 0);
      let totalChatRevenueThisMonth: number = data.reduce((acc: number, chat: CChat) => {
        const now: Date = new Date();
        const createdAt: Date = new Date(chat?.createdAt);
        const payments: CPayment[] = chat?.paymentsByUser || [];

        const monthlyRevenue: number = payments.reduce((sum: number, payment: CPayment) => {
          // Check if payment has a date field
          const paymentDate: Date | undefined =
            payment.paymentAt || payment.createdAt;
          if (paymentDate) {
            const paidAt: Date = new Date(paymentDate);
            const isThisMonth: boolean =
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
      let totalChatRevenueThisWeek: number = data.reduce((acc: number, chat: CChat) => {
        const payments: CPayment[] = chat.paymentsByUser || [];
        let weeklyRevenue = payments.reduce((sum: number, payment: CPayment) => {
          const paymentDate: Date | undefined =
            payment.paymentAt || payment.createdAt;
          if (paymentDate) {
            const now: Date = new Date();
            const createdAt: Date = new Date(paymentDate);
            const oneWeekAgo: Date = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            const thisWeek: boolean = createdAt >= oneWeekAgo && createdAt <= now;
            if (thisWeek) {
              return sum + (Number(payment.amount) || 0);
            }
          }
          return sum;
        }, 0);

        return acc + weeklyRevenue;
      }, 0);

      let totalChatRevenueToday: number = data.reduce((acc: number, chat: CChat) => {
        const payments: CPayment[] = chat.paymentsByUser || [];
        const todaysRevenue: number = payments.reduce((sum: number, payment: CPayment) => {
          const paymentDate: Date | undefined =
            payment.paymentAt || payment.createdAt;
          if (paymentDate) {
            const now: Date = new Date();
            const createdAt: Date = new Date(paymentDate);
            const isToday: boolean =
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

      let totalChatRevenueLastMonth: number = data.reduce((acc, chat) => {
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
            (sum: number, payment: CPayment) => sum + (Number(payment.amount) || 0),
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
      // console.log("This is the total chat revenue", totalChatRevenue);
      // console.log(
      //   "This is the total Chat Revenue Last Month",
      //   totalChatRevenueLastMonth
      // );
      // console.log(
      //   "This is the total Chat revenue this month",
      //   totalChatRevenueThisMonth
      // );
      // console.log(
      //   "This is the total Chat revenue this week",
      //   totalChatRevenueThisWeek
      // );
      // console.log(
      //   "This is the total Chat revenue today",
      //   totalChatRevenueToday
      // );
    } catch (error: any) {
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

  const handleFetchAllPayments = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get(`/api/admin/allPayments`);
      const data = response?.data?.payments;
      setPayments(data);
      console.log("This is the data of all the payments", data);
    } catch (error: any) {
      console.log("This is the error on the console CourseStatsPage :", error);
      throw error;
    }
  }, [authUser]);
  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout((): void => {
      getMyCourses();
    }, 300); // Small delay to prevent immediate load
    return (): void => clearTimeout(timer);
  }, [getMyCourses]);

  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout((): void => {
      getDetailsOfInstructor();
    }, 350); // Small delay to prevent immediate load
    return (): void => clearTimeout(timer);
  }, [courses]);
  useEffect((): void => {
    console.log("These are the courses", courses);
  }, [courses]);

  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout((): void => {
      handleFetchChatStats();
      handleFetchAllPayments();
    }, 400); // Small delay to prevent immediate load
    return (): void => clearTimeout(timer);
  }, [handleFetchChatStats, handleFetchAllPayments]);



  return (
    <div className={cn("w-full min-h-screen flex flex-col justify-start items-center py-6 relative", className)}>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
              <IoSearch className="absolute top-2 right-2 text-lg" />
            </span>
            <Select
              onValueChange={(value: string) => setSelectedView(value)}
              defaultValue={"students"}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectGroup>
                  <SelectLabel className="">Admin Views</SelectLabel>
                  <SelectItem className="" value="students">students</SelectItem>
                  <SelectItem className="" value="courses">courses</SelectItem>
                  <SelectItem className="" value="payments">payments</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full flex justify-end items-center">
            <Select
              onValueChange={(value: string) => setCountRecords(value ? parseInt(value) : 10)}
              defaultValue={"10"}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Records" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectGroup>
                  <SelectLabel className="" >Count Records</SelectLabel>
                  <SelectItem className="" value="10">10</SelectItem>
                  <SelectItem className="" value="30">30</SelectItem>
                  <SelectItem className="" value="50">50</SelectItem>
                  <SelectItem className="" value="100">100</SelectItem>
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
              {filteredEnrolledStudent?.length === 0 ? (
                <p className="text-muted-foreground text-lg">
                  {searchTerm?.trim() === ""
                    ? "No students enrolled yet."
                    : `No students found for "${searchTerm}"`}
                </p>
              ) : (
                filteredEnrolledStudent?.slice(0, countRecords).map((user: CEnrolledStudent) => (
                  <Card key={user._id} className="w-full h-[80px]">
                    <CardContent className="">
                      <div className="w-full grid grid-cols-5 px-2 text-center font-semibold">
                        <Avatar className="">
                          <AvatarImage
                            className=""
                            src={
                              user?.profileImage ||
                              "https://github.com/shadcn.png"
                            }
                          />
                          <AvatarFallback className="">CN</AvatarFallback>
                        </Avatar>
                        <div className="flex justify-start items-start">
                          {user?.name}
                        </div>
                        <div className="capitalize flex justify-start items-start">
                          {user?.role}
                        </div>
                        <div className="flex justify-start items-start">
                          {user?.email}
                        </div>
                        <div className="flex justify-start items-start">
                          {user?.phoneNumber || user._id}
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
              {(filteredCourses.slice(0, countRecords) || []).map((course: CCourse) => (
                <Card key={course._id} className="w-full h-auto">
                  <CardContent className="" >
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
                              src={course?.coverImage || ""}
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
                  (payment: CPayment) => (
                    <Card key={payment._id} className="w-full h-[80px]">
                      <CardContent className="">
                        <div className="w-full grid grid-cols-4 px-2 text-center font-semibold">
                          <div>{payment?.paymentId}</div>
                          <div className="">{Number(payment?.amount)}</div>
                          <div>
                            {new Date(payment?.paymentAt ?? "").toLocaleString(
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

export default CourseStatsComp;
