"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Clock, Users, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CourseShowcaseProps } from "@/types/client";



export default function CourseShowcase({ 
  courses, 
  isLoading, 
  title, 
  subtitle, 
  showViewAll = true,
  formatRatingNumber,
  convertToTotalHours 
}: CourseShowcaseProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <Skeleton className="w-full h-[600px] rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            <p className="text-xl text-gray-600 max-w-2xl">{subtitle}</p>
          </div>
          {showViewAll && (
            <Button 
            size=""
            vatiant=""
              variant="outline" 
              className="hidden md:flex items-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => router.push('/courses')}
            >
              View All Courses
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: false,
            dragFree: true,
          }}
          plugins={[]}
          setApi={() => {}}

          className="w-full"
        >
          <CarouselContent className="w-full -ml-4">
            {courses.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Skeleton className="w-full h-[400px] rounded-xl" />
                </CarouselItem>
              ))
            ) : (
              courses.map((course) => (
                <CarouselItem key={course._id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Link href={`/courses/${course._id}`}>
                    <Card className="group w-full h-[400px] border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-48 w-full overflow-hidden">
                          {course?.coverImage ? (
                            <Image
                              src={course.coverImage}
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                              <span className="text-4xl">📚</span>
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <Badge variant="" className="bg-white/90 text-gray-800 hover:bg-white">
                              {course?.category?.name}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-6 flex flex-col h-52">
                        <div className="w-full space-y-3">
                          <h3 className="text-lg font-semibold line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600">
                            by {course?.instructor?.name || "Expert Instructor"}
                          </p>

                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {course?.rating ? formatRatingNumber(course.rating) : "New"}
                              </span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>
                                {course?.duration ? convertToTotalHours(course.duration) : "0"}h
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <div className="text-2xl font-bold text-gray-900">
                              ₹{course?.price ? parseInt(course.price.toString()) : "Free"}
                            </div>
                            <Button size="sm" variant="" className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                              Enroll Now
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </CarouselItem>
              ))
            )}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>

        {showViewAll && (
          <div className="text-center mt-8">
            <Button
              size=""
              variant="" 
              className="md:hidden bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/courses')}
            >
              View All Courses
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}