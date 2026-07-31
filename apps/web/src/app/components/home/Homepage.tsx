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
import { toast } from 'sonner'
import { useSession } from "next-auth/react";
import { CCategory, CCourse, CReview, CUserLocation } from "@/types/client";
import { formatRelativeDate } from "@/utils/date";
import { ReviewSortOption, sortedReviews } from "@/lib/helpers/sortReviews";
import { fetchUserLocation } from "@/lib/helpers/getUserLocation";
import { convertToTotalHours, formatRatingNumber } from "@/utils/timeFormat";
import { CCategoryWithChildren } from "@/lib/getCachedCategory";
import { getCategoryCourses, getRandomCourses } from "@/lib/helpers/sortCourses";
import { getPopularCategories } from "@/lib/helpers/sortCategories";

export interface HomeProps {
  initialCourses: CCourse[];
  fetchedReviews: CReview[];
  allCategories:CCategoryWithChildren[];
}
export default function HomePage({ initialCourses, fetchedReviews, allCategories }: HomeProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { fetchCourses, courses, setCourses,reviews,categories } = useCourseStore();
const saveUserGeography = useAuthStore((state) => state.saveUserGeography);
const authUser = useAuthStore((state) => state.authUser);
const setAuthUser = useAuthStore((state) => state.setAuthUser);
const userLocation = useAuthStore((state) => state.userLocation);
 
  const [userGeography, setUserGeography] = useState<CUserLocation | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);
  // const courses = useCourseStore((state) => state.courses);
  const [allCourses, setAllCourses] = useState<CCourse[]>(initialCourses || []);
  const [totalCategories, setTotalCategories] = useState<CCategoryWithChildren[]>(allCategories || []);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [allReviews, setAllReviews] = useState<CReview[]>(fetchedReviews || []);
  const [sortBy, setSortBy] = useState<ReviewSortOption>("helpful");
  const [randomReviews, setRandomReviews] = useState<CReview[]>([]);
  const [shuffledCourses, setShuffledCourses] = useState<CCourse[]>([]);
  // Filter the course on behalf of the selected categories //
  
  //Fetch user geographical location to show popular categories
  useEffect(() => { 
    if (reviews.length > 0) {
      const sorted = sortedReviews(allReviews, sortBy);
      setRandomReviews(sorted);
    }
    
}, [reviews]);
useEffect(() => {
  if(initialCourses.length > 0) {
    setShuffledCourses(getRandomCourses(initialCourses));
  }
  setAllCourses(initialCourses)
},[initialCourses])
  useEffect(() => { 

    if (allReviews.length > 0 && allCourses.length > 0 && allCategories.length > 0 ) {
      
      fetchCourses({ fetchedCategories: allCategories, fetchedReviews: allReviews, fetchedCourses: allCourses });
    }
    
}, [allReviews, allCourses, allCategories])

  // Effect for fetching user location (if it's independent)
useEffect(() => {
  async function loadLocation(): Promise<void> {
    await saveUserGeography();
    setUserGeography(userLocation); 
  }
  loadLocation();
}, []);

//Auth status
useEffect(() => {
    // Check for OAuth success toast
    const hasJustLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (hasJustLoggedIn) {
      toast.success('Login successful');
      sessionStorage.removeItem('justLoggedIn');
    }
}, []);

  return (
    <div className=" flex  items-center justify-center  min-h-screen  pb-20 gap-10 font-(family-name:--font-geist-sans) dark:bg-black bg-white">
      <div className="w-[95%]  flex flex-col justify-center items-center gap-6">
        <div className="inline-block py-8 " >

          <h1 className="text-4xl font-bold text-center ">  {session ? `${session?.user?.name.split(" ").length === 3
            ? session?.user?.name.split(" ")[1]  // Middle name for 3 parts
            : session?.user?.name.split(" ")[0]  // First name for 2 parts
            }, welcome to` : "Welcome to"}  Brainnest where education is a game</h1>
        </div>
        <div className="w-4/5 max-w-4/5 flex items-center justify-center ">
          <div className="flex flex-col items-center justify-center w-full ">
            {isLoadingPage ? (<Skeleton className="w-full h-100 rounded-md" />) : (<Carousel plugins={[]} className="">
              <CarouselContent className={"w-full"}>
                {allCourses.length === 0 ? <Skeleton className="w-326 h-100"></Skeleton> : allCourses.map((course: CCourse) => (
                  <CarouselItem className="" key={course._id}>
                    <div className="relative">
                      <source srcSet="https://img-c.udemycdn.com/notices/web_carousel_slide/image_responsive/e69a9ca9-bb56-4fda-954a-5ccbec2ac33e.png" width="1304" height="400" media="(max-width: 43.75rem)"></source>
                      <Image src="/assets/banner/banner-1.png" width={1350} height={500} alt={course?.title} priority={true} />
                      
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
          <div className="w-[90%] md:w-[70%]  min-h-137.5 p-4 gap-8">
            {isLoadingPage ? (<Skeleton className="w-full h-full rounded-md" />) : (<><div className="mb-4 flex flex-col gap-2">
              <h2 className="text-3xl font-bold ">Ready to imagine your career?</h2>
              <p className="text-gray-600">Get the skills and real-world experienced employerswant with Career Accelerators.</p>
            </div>
              <Carousel

                opts={{
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
                <CarouselContent className="w-full -ml-1">
                  {(courses || []).map((course: CCourse) => (
                    <CarouselItem key={course?.title} className="pl-1 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="p-1">
                        <Link href={`/courses/${course._id}`} className="w-full h-full">
                          <Card className="w-full h- 87.5 my-0 relative overflow-hidden flex flex-col">
                            <CardContent className="h-45 w-full flex justify-start relative -mt-3 p-4">
                              {course?.coverImage ? (
                                <div className="relative w-full h-45 rounded-xl overflow-hidden">
                                  <Image
                                    src={course.coverImage}
                                    alt={course.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <Skeleton className="w-full h-45" />
                              )}
                            </CardContent>
                            <CardFooter className="flex-1 p-4">
                              <div className="w-full flex flex-col gap-1">
                                <p className="text-lg max-w-lg font-semibold wrap-break leading-tight line-clamp-2 min-h-15 ">{course.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {course?.instructorId?.name}
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs ">{course.averageRating || 0} ⭐</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {course?.totalDurationInSeconds && `⏱️ ${convertToTotalHours(course.totalDurationInSeconds)}`} h
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
                {/* <CarouselPrevious className={"ml-3"} /> */}
                <CarouselNext className="" />
              </Carousel>
              <Button size="default" variant="default" className="rounded-none mt-4 mx-3" onClick={() => { router.push('courses') }}>All Career Accelerators</Button></>)}
          </div>
        </div>

        {/* skill section */}
        {isLoadingPage ? (<Skeleton className="w-175 h-137.5 rounded-md" />) : (<div className=" w-full flex items-center justify-center gap-4 bg-brand-white dark:bg-black ">
          {isLoadingPage ? (<Skeleton className="min-w-125 h-137.5 rounded-md" />) : (<div className="w-[90%] md:w-[70%] xl:max-w-[75%]  min-h-137.5 p-4 gap-8">
            <div className="mb-4 flex flex-col gap-2">
              <h2 className="text-3xl font-bold ">All the skills you need in one place</h2>
              <p className="text-gray-600">Form critical skills to technical topics,Brainnest supports you every step of the way</p>
            </div>
            <div className="flex w-full h-125 ">
              {categories.length > 0 && (
                <Tabs defaultValue={categories[0].name} className={"w-full h-full"}>
                  <Carousel plugins={[]} className="w-full ">
                    <CarouselContent className="flex w-full px-2 border-b-2 border-b-gray-300 dark:border-b-gray-500   z-0">
                      {categories.map((category:CCategory) => (
                        <CarouselItem key={category._id} className="flex-none w-auto px-2 -mb-0.5 z-50 relative">
                          <TabsList className={"m-0 border-0 shadow-none ring-0 bg-transparent p-0 w-auto"}>
                            <TabsTrigger value={category.name} className="capitalize w-full h-full border-r-0 border-t-0 border-l-0 border-b-2 rounded -none shadow-none ring-0 bg-transparent  p-0 pl-0 dark:data-[state=active]:border-b-gray-300 data-[state=active]:border-b-black data-[state=active]:shadow-none data-[state=active]:ring-0 data-[state=active]:bg-transparent! data-[state=active]:p-0 data-[state=active]:rounded-none ">{category.name}</TabsTrigger>
                          </TabsList>
                        </CarouselItem>
                      ))}

                    </CarouselContent>

                    <CarouselNext className={"-ml-4"} />
                  </Carousel>


                  {/* Tabs Content */}
                  {categories.map((category: CCategoryWithChildren) => (
                    <TabsContent key={category._id} value={category.name} className={"bg-transparent py-4 px-2 pt-8"}>
                      {/* Nested Tabs for subcategories */}
                      {category && category.children.length > 0 && <Tabs defaultValue={category.children[0].name || ""} className={"w-full "}>
                        <TabsList className="flex w-full border-0 shadow-none ring-0 bg-transparent p-0 mr-auto">
                          <Carousel   className={"w-full px-2"}>
                            <CarouselContent className="" >
                              {(category.children || []).map((sub:CCategory) => (
                                <CarouselItem key={sub._id} className={"px-4 "}>
                                  <TabsTrigger value={sub.name} className={"border-0 shadow-none ring-0 bg-transparent px-4 py-4 rounded-full data-[state=active]:bg-brand-white! dark:bg-black dark:data-[state=active]:bg-white! dark:data-[state=active]:border-white!dark:data-[state=active]:!border-1  dark:text-black dark:data-[state=active]:text-black! "}>{sub.name}</TabsTrigger>
                                </CarouselItem>
                              ))}

                            </CarouselContent>

                            <CarouselNext className={"ml-4"} />
                          </Carousel>
                        </TabsList>

                        {/* Subcategory Content */}
                        {(category.children || []).map((sub: CCategory) => (
                          <TabsContent key={sub._id} value={sub.name} className={"flex justify-center "}>
                            <Carousel  className="mt-4 w-full">
                              <CarouselContent className={"w-full px-2 -ml-2 md:-ml-4"}>
                                {getCategoryCourses(sub._id, category._id,courses).map((course:CCourse) => (
                                  <CarouselItem key={course._id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3">
                                    <Link href={`/courses/${course._id}`} className="inline-block">
                                      <Card className="w-75 h-87.5 relative">
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
                                            <Skeleton className="w-full h-50" />
                                          )}
                                        </CardContent>
                                        <CardFooter className="flex-1">
                                          <div className="w-full flex flex-col flex-1 gap-2">
                                            <p className="capitalize text-xl font-semibold wrap-break leading-snug">
                                              {course.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{course?.instructorId?.name}</p>
                                            <div className="flex gap-2">
                                              <Badge
                                                className=""
                                                variant="outline">{course?.averageRating ? `${formatRatingNumber(course.averageRating)} ⭐` : "0"}</Badge>
                                              <Badge
                                                className=""
                                                variant="outline">
                                                {course?.totalDurationInSeconds ? `⏱️ ${convertToTotalHours(course.totalDurationInSeconds)} ` : "0"} hours
                                              </Badge>
                                            </div>
                                          </div>
                                        </CardFooter>
                                      </Card>
                                    </Link>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious className="" />
                              <CarouselNext className={"ml-4"} />
                            </Carousel>
                          </TabsContent>
                        ))}
                      </Tabs>}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>

          </div>)}
        </div>)}


        {/* Popular Categories */}
        <div className="w-[90%] md:w-[70%] xl:max-w-[75%]  min-h-137.5 p-4 gap-8">
          {isLoadingPage ? (<Skeleton className="w-full h-full rounded-md" />) : (
            <div className="w-full"><div className="mb-4 flex flex-col gap-2 w-full h-full">
              <h2 className="text-3xl font-bold ">Popular categories </h2>
              <p className="text-gray-600">Get the skills and real-world experienced employerswant with Career Accelerators.</p>
            </div>
              <div className="grid-cols-3 flex-1">
                <Carousel plugins={[]} className="w-full">
                  <CarouselContent className={"w-full px-2 -ml-2 md:-ml-4"}>
                    {courses.length === 0 ? (
                      <CarouselItem className="w-full flex justify-center px-2 -ml-2 md:-ml-4
pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/4  gap-4">
                        <Skeleton className="min-w-50 h-50 rounded-md  " />
                        <Skeleton className="min-w-50 h-50 rounded-md" />
                        <Skeleton className="min-w-50 h-50 rounded-md" />
                        <Skeleton className="min-w-50 h-50 rounded-md" />
                        <Skeleton className="min-w-50 h-50 rounded-md" />
                        <Skeleton className="min-w-50 h-50 rounded-md" />
                      </CarouselItem>
                    ) : (
                      getPopularCategories(categories || []).map((category: CCategoryWithChildren, index) => (
                        <CarouselItem key={index} className="w-full px-2 -ml-2 md:-ml-4
pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                          <div className="w-62.5 h-70 my-2 relative">
                            <Link href={`courses`} className="w-full h-full">

                              <Card className="w-full h-full border-0 shadow-none ring-0 bg-transparent p-0 gap-2">
                                <CardContent className="h-3/5 w-full flex justify-center  relative">
                                  <div className="relative w-full h-full p-4 rounded-none overflow-hidden flex items-center justify-center bg-[#F6F7F9]">
                                    <div className="w-1/2 h-1/2 relative flex justify-center items-center ">
                                      <Image
                                        src={category ? getCategoryImagePath(category.name) : "/placeholder.png"}
                                        alt={category.name ?? "Category image"}
                                        fill
                                        className="object-cover hover:scale-150 transition-transform duration-300 ease-in-out"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = `https://via.placeholder.com/150x150/f0f0f0/666666?text=${category.name}`;
                                        }}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex-1 items-start">
                                  <div className="w-full flex flex-col items-center gap-2">
                                    <p className="capitalize text-lg font-semibold">{category.name}</p>
                                    <p className="text-[9px] xl:text-sm text-muted-foreground">Explore {category.name} courses</p>
                                  </div>
                                </CardFooter>
                              </Card>
                            </Link>
                          </div>
                        </CarouselItem>
                      ))
                    )}
                  </CarouselContent>
                  {/* <CarouselPrevious />
                  <CarouselNext className={"ml-4"} /> */}
                </Carousel>
              </div>
              <div className="w-full bg-brand-white dark:bg-black  flex flex-col justify-center items-center gap-4 py-3 mt-4">
                {isLoadingPage ? (<Skeleton className="w-full h-12.5 rounded-md" />) : (<>
                  <p className="text-sm">Trusted by over 1000+ Companies Over and lakhs of Students around the world</p>
                  <div className="w-full max-h-25 flex justify-center items-center border-none outline-none">{["https://cms-images.udemycdn.com/content/tqevknj7om/svg/volkswagen_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/2gevcc0kxt/svg/samsung_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/mueb2ve09x/svg/cisco_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/ryaowrcjb2/svg/vimeo_logo_resized-2.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/bthyo156te/svg/procter_gamble_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/luqe0d6mx2/svg/hewlett_packard_enterprise_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/siaewwmkch/svg/citi_logo.svg?position=c&quality=80&x.app=portals", "https://cms-images.udemycdn.com/content/swmv0okrlh/svg/ericsson_logo.svg?position=c&quality=80&x.app=portals"].map((item, index) => <div key={index} className="relative w-25 h-25 p-1 md:p-4 rounded-none overflow-hidden flex items-center justify-center bg-brand-white border-0! shadow-none! ring-0 outline-none! border-none! ">
                    <div className="w-full h-full relative flex justify-center items-center border-0!  border-none! outline-none! shadow-none">
                      <Image
                        src={item}
                        alt={item}
                        fill
                        className="object-contain hover:scale-105 transition-transform duration-300 ease-in-out border-0 border-none! outline-none! shadow-none"
                      />
                    </div>
                  </div>)}</div></>
                )}
              </div>
            </div>)}
        </div>



        {/* // Random Courses // */}
        <div className="w-[90%] md:w-[70%] xl:max-w-[75%]  h-137.5 p-4 gap-8">
          {isLoadingPage ? (<div className="w-full h-full flex flex-row justify-center items-center gap-4">
            <Skeleton className="w-max-w-[280px]  h-full rounded-md" />
            <Skeleton className="w-full h-full rounded-md" />
            <Skeleton className="w-full h-full rounded-md" />
            <Skeleton className="w-full h-full rounded-md" />

          </div>) : (
            <div className="w-full"><div className="mb-4 flex flex-col gap-2 w-full h-full">
              <h2 className="text-3xl font-bold ">Learn from popular categories in {userGeography?.country_name} </h2>
              <p className="text-gray-600">Get the skills and real-world experienced employerswant with Career Accelerators.</p>
            </div>
              <div className="w-full ">
                <Carousel


                  opts={{
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
                  <CarouselContent className="w-full -ml-1">
                    {shuffledCourses.length === 0 ? <CarouselItem className="flex gap-4">
                      <Skeleton className="w-70 h-87.5 rounded-md  " />
                      <Skeleton className="w-70 h-87.5 rounded-md" />
                      <Skeleton className="w-70 h-87.5 rounded-md" />
                      <Skeleton className="w-70 h-87.5 rounded-md" />
                    </CarouselItem> : ( shuffledCourses || []).map((course: CCourse, index: number) => (
                      <CarouselItem key={course._id} className="pl-1 sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <div className="px-3 py-1">
                          <Link href={`/courses/${course._id}`} className="inline-block">
                            <Card className="w-full max-w-70 h-87.5 my-2 relative pt-0 pb-3 flex flex-col items-start">
                              <CardContent className="h-37.5 w-full flex justify-center relative p-0">
                                {course?.coverImage ? (
                                  <div className="relative h-37.5 w-full rounded-t-xl  overflow-hidden">
                                    <Image
                                      src={course?.coverImage}
                                      alt={course?.title}
                                      fill
                                      className="object-cover p-0"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    />
                                  </div>
                                ) : (
                                  <Skeleton className="w-full h-50" />
                                )}
                              </CardContent>
                              <CardFooter className={"flex-1"}>
                                <div className="w-full flex flex-col flex-1 items-start justify-center gap-2">
                                  <p className="capitalize text-lg font-semibold wrap-break leading-snug">{course.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {course?.instructorId?.name}
                                  </p>
                                  <p className=" text-muted-foreground text-xs">
                                    ₹{parseInt(String(course?.price || 0))}
                                  </p>
                                  <div className="flex gap-2">
                                  <Badge className="text-xs" variant="outline">{course?.averageRating && `${formatRatingNumber(course.averageRating)} ⭐`}</Badge>
                                    <Badge className="flex gap-2 text-xs" variant="outline">
                                      {course?.totalDurationInSeconds && `⏱️ ${convertToTotalHours(course.totalDurationInSeconds)}`} hours
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
                  <CarouselPrevious className="" />
                  <CarouselNext className="" />
                </Carousel>
              </div>
            </div>)}
        </div>


        {/* Reviews About the brainnest */}
        <div className="w-[90%] md:w-[70%] xl:max-w-[75%]  min-h-87.5  p-4 mt-15 sm:mt-1 gap-4 sm:gap-8 ">
          {isLoadingPage ? (
            <Skeleton className="w-full h-full rounded-md" />
          ) : (
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
                      <CarouselItem className="flex gap-4">
                        <Skeleton className="w-70 h-75 rounded-md  " />
                        <Skeleton className="w-70 h-75 rounded-md  " />
                        <Skeleton className="w-70 h-75 rounded-md  " />
                        <Skeleton className="w-70 h-75 rounded-md  " />
                      </CarouselItem>
                    ) : (
                      (reviews.length > 0 ? reviews : randomReviews || []).map((review, index) => (
                        <CarouselItem key={`${index}-${index}`} className="px-2 sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <div className=" my-2 relative">
                            <Link href={`/`}>
                              <Card className=" h-70 my-2 relative pt-0 pb-3">
                                <CardHeader className="w-full h-1/8 flex justify-start items-center relative -mb-4">
                                  <ImQuotesLeft />
                                </CardHeader>
                                <CardContent className="min-h-1/5 max-h-2/5 w-full flex justify-center relative ">
                                  <p className="text-sm wrap-break-word line-clamp-5">{review?.comment}</p>
                                </CardContent>
                                <CardFooter className={"h-2/5"}>
                                  <div className="w-full flex justify-start items-center   gap-2">

                                    <div className="h-full w-1/3 flex flex-col items-center justify-start">
                                      <div className="relative w-12.5 h-12.5 rounded-full overflow-hidden flex items-center justify-center bg-[#F6F7F9] dark:text-black">
                                        {review?.user?.profileImage ? (<Image src={review?.user?.profileImage || "/user.png"} alt={review?.user?.name || "user"} width={50} height={50} className="w-full h-full object-cover" />) : (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" stroke-linejoin="round" className="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)}
                                        {/*  */}

                                      </div>

                                    </div>
                                    <div className="h-full flex flex-col  w-2/3">
                                      <p className="capitalize text-sm font-semibold leading-snug">{review?.user?.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {formatRelativeDate(review?.createdAt || review?.updatedAt)}
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
                  <CarouselPrevious className="" />
                  <CarouselNext className={"ml-4"} />
                </Carousel>
              </div>
            </div>)}
        </div>
      </div>


    </div >
  );
}
