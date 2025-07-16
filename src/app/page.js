"use client"

import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCourseStore } from "@/lib/store/useCourseStore";
import axios from 'axios'
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getCategoryImagePath } from "@/app/components/getCategoryImagePath";
import Link from "next/link";
import { ImQuotesLeft } from "react-icons/im";
import Autoplay from "embla-carousel-autoplay";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMemo } from "react";
import {

  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useRouter } from 'next/navigation'


export default function Home() {
  const [userLocation, setUserLocation] = useState(null);
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const { fetchCourses, courses, setCourses } = useCourseStore();
  // const courses = useCourseStore((state) => state.courses);
  const [allCourses, setAllCourses] = useState([]);
  const [categoryImages, setCategoryImages] = useState({});
  const [reviews, setReviews] = useState([]);
  const router = useRouter();






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

  //Filtered Categories //
  const uniqueCategories = useMemo(() => {
    if (!courses || courses.length === 0) return [];

    const categoriesSet = new Set(
      courses.map((course) => course?.category?.name).filter(Boolean)
    );

    return Array.from(categoriesSet);
  }, [courses]);


  // //Filtered Subcategories //
  const subCategories = useMemo(() => {
    const map = {};

    courses.forEach((course) => {
      const mainCategory = course?.category?.name;
      const subCategories = course?.category?.subCategories;

      if (mainCategory && subCategories) {
        if (!map[mainCategory]) {
          map[mainCategory] = new Set();
        }

        // Ensure subCategories is a comma-separated string, then split and trim
        subCategories

          .map((sub) => sub.trim())
          .forEach((sub) => {
            if (sub) map[mainCategory].add(sub);
          });
      }
    });

    // Convert Sets to arrays
    const result = {};
    for (const key in map) {
      result[key] = Array.from(map[key]);
    }

    return result;
  }, [courses]);
  // Filter the course on behalf of the selected categories //
  function getCourses(category, subCategories) {
    const categoryReleatedCourses = courses.filter(course =>
      course?.category?.name === category && course?.category.subCategories.includes(subCategories)
    );
    // console.log("This is the category related courses", categoryReleatedCourses);
    return categoryReleatedCourses;
  }

  //Fetch user geographical location to show popular categories
  const fetchUserLocation = useCallback(async () => {
    try {
      const response = await axios.get("https://ipapi.co/json/"); // or use ipinfo.io
      const data = response.data;
      // console.log("User location:", data);
      // console.log("This is the user location", userLocation);
      setUserLocation(data); // contains fields like country, city, etc.
    } catch (error) {
      // console.error("Error fetching location:", error);
    }
  }, [authUser]);

  const getAllCourses = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const allCourses = await fetchCourses();
      setAllCourses(allCourses);
      setCourses(allCourses);
    } catch (error) {
      // console.error("Error fetching courses:", error);
      
    } finally {
      setIsLoadingPage(false);
    }
  }, [fetchCourses]);

  const ranndomCoursesOnRating = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    const randomCourseLength = Math.floor(Math.random() * 12) + 1;
    const shuffled = [...courses].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, randomCourseLength);
  }
    , [courses])
  const randomCategories = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    const randomCourseLength = Math.floor(Math.random() * 12) + 1;
    const shuffled = [...uniqueCategories].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, randomCourseLength);
  }, [courses])


  const fetchReviews = useCallback(async () => {
    const response = await axios('/reviews/reviews.json')
    const reviewsData = response.data;
    setReviews(reviewsData);
    // console.log("This is the reviews state", reviews);
    // console.log("This is the reviews data", reviewsData);
  }, []);
  useEffect(() => {
    fetchReviews();
  }, []);
  useEffect(() => {
    setTimeout(() => {
      getAllCourses();
    }, 200);
  }, [getAllCourses]);

  // Effect for fetching user location (if it's independent)
  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);



  useEffect(() => {
    if (courses) {
      // console.log("This is the unique Categories", uniqueCategories);
      // console.log("This is the Subcategories", subCategories);
    }
  }, [uniqueCategories, subCategories]);

  return (
    <div className=" flex  items-center justify-center  min-h-screen  pb-20 gap-10 font-[family-name:var(--font-geist-sans)] dark:bg-black bg-white">
      <div className="!w-[95%]  flex flex-col justify-center items-center gap-6">
        <div className="inline-block py-8 " >
          <h1 className="text-4xl font-bold text-center ">Welcome to Brainnest where education is a game</h1>
        </div>
        <div className="w-4/5 max-w-4/5 flex items-center justify-center ">
          <div className="flex flex-col items-center justify-center w-full ">
            {isLoadingPage ? (<Skeleton className="w-full h-[400px] rounded-md" />) : (<Carousel>
              <CarouselContent className={"w-full"}>
                {courses.length === 0 ? <Skeleton className="w-[1304px] h-[400px]"></Skeleton> : courses.map((course) => (
                  <CarouselItem key={course._id}>
                    <div className="relative">
                      <source srcSet="https://img-c.udemycdn.com/notices/web_carousel_slide/image_responsive/e69a9ca9-bb56-4fda-954a-5ccbec2ac33e.png" width="1304" height="400" media="(max-width: 43.75rem)"></source>
                      <Image src="https://img-c.udemycdn.com/notices/web_carousel_slide/image/d4a1717d-1ad2-4570-adf9-e0ab20b3ab75.png" width={1350} height={500} alt={course?.title} priority={true} />
                    </div>
                    {/* <div className="absolute inset-0 bg-black opacity-50"></div> */}
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* <CarouselPrevious />
              <CarouselNext /> */}
            </Carousel>)}
          </div>
        </div>
        <div className="w-full flex justify-center ">
          <div className="w-[90%] md:w-[70%]  min-h-[550px] p-4 gap-8">
            {isLoadingPage ? (<Skeleton className="w-full h-full rounded-md" />) : (<><div className="mb-4 flex flex-col gap-2">
              <h2 className="text-3xl font-bold ">Ready to imagine your career?</h2>
              <p className="text-gray-600">Get the skills and real-world experienced employerswant with Career Accelerators.</p>
            </div>
              <Carousel
                opts={{
                  align: "start",
                }}
                className="w-full max-w-full"
              >
                <CarouselContent className={"w-full px-2 -ml-2 md:-ml-4"}>
                  {(courses || []).map((course) => (
                    <CarouselItem key={course?.title} className="w-full px-2 -ml-2 md:-ml-4
pl-2 md:pl-6 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3">
                      <Link href={`/courses/${course._id}`} className="inline-block">
                        <Card className="w-[300px] h-[350px] my-2 relative">
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
                          <CardFooter className={"flex-1"}>
                            <div className="w-full flex flex-col flex-1 gap-2">
                              <p className="capitalize text-xl font-semibold break-words leading-snug">{course.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {course?.instructor?.name}
                              </p>
                              <div className="flex gap-2">
                                <Badge variant="outline">{course?.rating && formatRatingNumber(course.rating)}</Badge>
                                <Badge variant="outline flex gap-2">
                                  {course?.duration && convertToTotalHours(course.duration)} hours
                                </Badge>
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      </Link >
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              <Button className="rounded-none mt-4 mx-3" onClick={() => { router.push('courses') }}>All Career Accelerators</Button></>)}
          </div>
        </div>

        {/* skill section */}
        <div className=" w-full flex items-center justify-center gap-4 bg-[#F6F7F9] dark:bg-black ">
          <div className="w-[90%] md:w-[70%] xl:max-w-[75%]  min-h-[550px] p-4 gap-8">
            {isLoadingPage ? (<Skeleton className="w-full h-full rounded-md" />) : (<><div className="mb-4 flex flex-col gap-2">
              <h2 className="text-3xl font-bold ">All the skills you need in one place</h2>
              <p className="text-gray-600">Form critical skills to technical topics,Brainnest supports you every step of the way</p>
            </div>
              <div className="flex w-full h-[500px] ">
                {uniqueCategories.length > 0 && (
                  <Tabs defaultValue={uniqueCategories[0]} className={"w-full h-full"}>
                    <Carousel className="w-full ">
                      <CarouselContent className="flex w-full px-2 border-b-2 border-b-gray-300 dark:border-b-gray-500   z-0">
                        {uniqueCategories.map((category) => (
                          <CarouselItem key={category} className="flex-none w-auto px-2 -mb-[2px] z-50 relative">
                            <TabsList className={"m-0 border-0 shadow-none ring-0 bg-transparent p-0 w-auto"}>
                              <TabsTrigger value={category} className="capitalize w-full h-full border-r-0 border-t-0 border-l-0 border-b-2 rounded -none shadow-none ring-0 bg-transparent  p-0 pl-0 dark:data-[state=active]:border-b-gray-300 data-[state=active]:border-b-black data-[state=active]:shadow-none data-[state=active]:ring-0 data-[state=active]:!bg-transparent data-[state=active]:p-0 data-[state=active]:rounded-none ">{category}</TabsTrigger>
                            </TabsList>
                          </CarouselItem>
                        ))}

                      </CarouselContent>

                      <CarouselNext className={"-ml-4"} />
                    </Carousel>


                    {/* Tabs Content */}
                    {uniqueCategories.map((category) => (
                      <TabsContent key={category} value={category} className={"bg-transparent py-4 px-2 pt-8"}>
                        {/* Nested Tabs for subcategories */}
                        <Tabs defaultValue={subCategories[category][0] || ""} className={"w-full "}>
                          <TabsList className="flex w-full border-0 shadow-none ring-0 bg-transparent p-0 mr-auto">
                            <Carousel className={"w-full px-2"}>
                              <CarouselContent >
                                {(subCategories[category] || []).map((sub) => (
                                  <CarouselItem key={sub} className={"px-4 "}>
                                    <TabsTrigger value={sub} className={"border-0 shadow-none ring-0 bg-transparent px-4 py-4 rounded-full data-[state=active]:!bg-[#F6F7F9] dark:bg-black dark:data-[state=active]:!bg-white dark:data-[state=active]:!border-white dark:data-[state=active]:!border-1  dark:text-black dark:data-[state=active]:!text-black "}>{sub}</TabsTrigger>
                                  </CarouselItem>
                                ))}

                              </CarouselContent>

                              <CarouselNext className={"ml-4"} />
                            </Carousel>
                          </TabsList>

                          {/* Subcategory Content */}
                          {(subCategories[category] || []).map((sub) => (
                            <TabsContent key={sub} value={sub} className={"flex justify-center "}>
                              <Carousel className="mt-4 w-full">
                                <CarouselContent className={"w-full px-2 -ml-2 md:-ml-4"}>
                                  {getCourses(category, sub).map((course) => (
                                    <CarouselItem key={course._id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3">
                                      <Link href={`/courses/${course._id}`} className="inline-block">
                                        <Card className="w-[300px] h-[350px] relative">
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
                                            <div className="w-full flex flex-col flex-1 gap-2">
                                              <p className="capitalize text-xl font-semibold break-words leading-snug">
                                                {course.title}
                                              </p>
                                              <p className="text-sm text-muted-foreground">{course?.instructor?.name}</p>
                                              <div className="flex gap-2">
                                                <Badge variant="outline">{course?.rating ? formatRatingNumber(course.rating) : "0"}</Badge>
                                                <Badge variant="outline">
                                                  {course?.duration ? convertToTotalHours(course.duration) : "0"} hours
                                                </Badge>
                                              </div>
                                            </div>
                                          </CardFooter>
                                        </Card>
                                      </Link>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext className={"ml-4"} />
                              </Carousel>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </div> </>)}

          </div>
        </div>


        {/* Popular Categories */}
        <div className="w-[90%] md:w-[70%] xl:max-w-[75%]  min-h-[550px] p-4 gap-8">
          {isLoadingPage ? (<Skeleton className="w-full h-full rounded-md" />) : (
            <div className="w-full"><div className="mb-4 flex flex-col gap-2 w-full h-full">
              <h2 className="text-3xl font-bold ">Learn from popular categories in {userLocation?.country_name} </h2>
              <p className="text-gray-600">Get the skills and real-world experienced employerswant with Career Accelerators.</p>
            </div>
              <div className="grid-cols-3 flex-1">
                <Carousel className="w-full">
                  <CarouselContent className={"w-full px-2 -ml-2 md:-ml-4"}>
                    {courses.length === 0 ? (
                      <CarouselItem className="w-full px-2 -ml-2 md:-ml-4
pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3">
                        <Skeleton className="w-[280px] h-[350px] rounded-md" />
                        <Skeleton className="w-[280px] h-[350px] rounded-md" />
                        <Skeleton className="w-[280px] h-[350px] rounded-md" />
                      </CarouselItem>
                    ) : (
                      (uniqueCategories || []).map((category, index) => (
                        <CarouselItem key={index} className="w-full px-2 -ml-2 md:-ml-4
pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                          <div className="w-[250px] h-[280px] my-2 relative">
                            <Link href={`courses`} className="w-full h-full">

                              <Card className="w-full h-full border-0 shadow-none ring-0 bg-transparent p-0 gap-2">
                                <CardContent className="h-3/5 w-full flex justify-center  relative">
                                  <div className="relative w-full h-full p-4 rounded-none overflow-hidden flex items-center justify-center bg-[#F6F7F9]">
                                    <div className="w-1/2 h-1/2 relative flex justify-center items-center ">
                                      <Image
                                        src={getCategoryImagePath(category)}
                                        alt={category}
                                        fill
                                        className="object-cover hover:scale-150 transition-transform duration-300 ease-in-out"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex-1 items-start">
                                  <div className="w-full flex flex-col items-center gap-2">
                                    <p className="capitalize text-lg font-semibold">{category}</p>
                                    <p className="text-sm text-muted-foreground">Explore {category} courses</p>
                                  </div>
                                </CardFooter>
                              </Card>
                            </Link>
                          </div>
                        </CarouselItem>
                      ))
                    )}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext className={"ml-4"} />
                </Carousel>
              </div>
              <div className="w-full bg-[#F6F7F9] dark:bg-black  flex flex-col justify-center items-center gap-4 py-3 mt-4">
                <p className="text-sm">Trusted by over 1000+ Companies Over and lakhs of Students around the world</p>
                <div className="w-full max-h-[100px] flex justify-center items-center ">{["https://cms-images.udemycdn.com/content/tqevknj7om/svg/volkswagen_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/2gevcc0kxt/svg/samsung_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/mueb2ve09x/svg/cisco_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/ryaowrcjb2/svg/vimeo_logo_resized-2.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/bthyo156te/svg/procter_gamble_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/luqe0d6mx2/svg/hewlett_packard_enterprise_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/siaewwmkch/svg/citi_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/swmv0okrlh/svg/ericsson_logo.svg?position=c&quality=80&x.app=portals"].map((item, index) => <div key={index} className="relative w-[100px] h-[100px] p-1 md:p-4 rounded-none overflow-hidden flex items-center justify-center bg-[#F6F7F9]">
                  <div className="w-full h-full relative flex justify-center items-center ">
                    <Image
                      src={item}
                      alt={item}
                      fill
                      className="object-contain hover:scale-105 transition-transform duration-300 ease-in-out"
                    />
                  </div>
                </div>)}</div>
              </div>
            </div>)}
        </div>



        {/* // Random Courses // */}
        <div className="w-[90%] md:w-[70%] xl:max-w-[75%]  h-[550px] p-4 gap-8">
          {isLoadingPage ? (<Skeleton className="w-full h-full rounded-md" />) : (
            <div className="w-full"><div className="mb-4 flex flex-col gap-2 w-full h-full">
              <h2 className="text-3xl font-bold ">Learn from popular categories in {userLocation?.country_name} </h2>
              <p className="text-gray-600">Get the skills and real-world experienced employerswant with Career Accelerators.</p>
            </div>
              <div className="w-full ">
                <Carousel
                  pts={{
                  align: "start",
                  loop: true,
                  dragFree: true,
                }}
                  plugins={[
                    Autoplay({
                      delay: 2500,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                  className="w-full max-w-full"
                >
                  <CarouselContent className={"w-full px-2 -ml-2 md:-ml-4"}>
                    {(ranndomCoursesOnRating || []).map((course,index) => (
                      <CarouselItem key={index+1} className="w-full  px-2 sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <div className="p-1">

                          <Link href={`/courses/${course._id}`} className="inline-block">
                            <Card className="w-[250px] h-[350px] my-2 relative pt-0 pb-3 flex flex-col items-start">
                              <CardContent className="h-[150px] w-full flex justify-center relative p-0">
                                {course?.coverImage ? (
                                  <div className="relative h-[150px] w-full rounded-t-xl  overflow-hidden">
                                    <Image
                                      src={course?.coverImage}
                                      alt={course?.title}
                                      fill
                                      className="object-cover p-0"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    />
                                  </div>
                                ) : (
                                  <Skeleton className="w-full h-[200px]" />
                                )}
                              </CardContent>
                              <CardFooter className={"flex-1"}>
                                <div className="w-full flex flex-col flex-1 items-start justify-center gap-2">
                                  <p className="capitalize text-lg font-semibold break-words leading-snug">{course.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {course?.instructor?.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    ₹{parseInt(course?.price)}
                                  </p>
                                  <div className="flex gap-2">
                                    <Badge variant="outline ">{course?.rating && formatRatingNumber(course.rating)}</Badge>
                                    <Badge variant="outline flex gap-2">
                                      {course?.duration && convertToTotalHours(course.duration)} hours
                                    </Badge>
                                  </div>
                                </div>
                              </CardFooter>
                            </Card>
                          </Link>

                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>)}
        </div>


        {/* Reviews About the brainnest */}
        <div className="w-[90%] md:w-[70%] xl:max-w-[75%]  min-h-[350px] p-4 gap-8">
          {isLoadingPage ? (<Skeleton className="w-full h-full rounded-md" />) : (
            <div className="w-full"><div className="mb-4 flex flex-col gap-2 w-full h-full">
              <h2 className="text-3xl font-bold ">See what others are achieving through learning </h2>
              <p className="text-gray-600">Know the achievers of the world through their stories</p>
            </div>
              <div className="w-full">
                <Carousel className="w-full" opts={{
                  align: "start",
                  loop: true,
                  dragFree: true,
                }}
                  plugins={[
                    Autoplay({
                      delay: 2500,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}>
                  <CarouselContent className="w-full -ml-1">
                    {courses.length === 0 ? (
                      <CarouselItem className="flex">
                        <Skeleton className="w-[280px] h-[300px] rounded-md" />
                        <Skeleton className="w-[280px] h-[300px] rounded-md" />
                        <Skeleton className="w-[280px] h-[300px] rounded-md" />
                        <Skeleton className="w-[280px] h-[300px] rounded-md" />
                      </CarouselItem>
                    ) : (
                      (reviews || ranndomCoursesOnRating || []).map((course, index, reviews) => (
                        <CarouselItem key={`${index}-${index}`} className="px-2 sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <div className=" my-2 relative">
                            <Link href={`/`}>
                              <Card className=" h-[280px] my-2 relative pt-0 pb-3">
                                <CardHeader className="w-full h-1/8 flex justify-start items-center relative -mb-4">
                                  <ImQuotesLeft />
                                </CardHeader>
                                <CardContent className="min-h-1/5 max-h-2/5 w-full flex justify-center relative ">
                                  <p className="text-sm break-words line-clamp-5">{course?.text}</p>
                                </CardContent>
                                <CardFooter className={"h-2/5"}>
                                  <div className="w-full flex justify-start items-center   gap-2">

                                    <div className="h-full w-1/3 flex flex-col items-center justify-start">
                                      <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-center bg-[#F6F7F9] dark:text-black">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        {/* {
                                          !course?.reviews[0]?.user?.profileImage ? (
                                            <Image
                                              src={course?.reviews[0]?.user?.profileImage}
                                              alt={course.title}
                                              fill
                                              className="object-cover rounded-full"
                                            />
                                          ) : (
                                            
                                          )
                                        } */}

                                      </div>

                                    </div>
                                    <div className="h-full flex flex-col  w-2/3">
                                      <p className="capitalize text-sm font-semibold break-words leading-snug">{course.reviews?.user?.name || course?.user?.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {course?.reveiews?.createdAt || course?.reveiews?.updatedAt || course?.createdAt || course?.updatedAt}
                                      </p>
                                    </div>

                                  </div>
                                </CardFooter>
                              </Card>
                            </Link>
                          </div>
                        </CarouselItem>
                      ))
                    )}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext className={"ml-4"} />
                </Carousel>
              </div>
            </div>)}
        </div>
      </div>


    </div >
  );
}
