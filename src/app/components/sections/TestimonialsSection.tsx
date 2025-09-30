"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Quote } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { TestimonialsSectionProps } from "@/types/client";



export default function TestimonialsSection({ reviews: reviews, fallbackCourses }: TestimonialsSectionProps) {
  const testimonials = reviews.length > 0 ? reviews : fallbackCourses.slice(0, 8);

  const defaultTestimonials = [
    {
      text: "Brainnest transformed my career completely. The courses are incredibly well-structured and the instructors are world-class.",
      user: { name: "Sarah Johnson" },
      rating: 5,
      position: "Software Engineer at Google"
    },
    {
      text: "The best investment I've made in my professional development. The community support is amazing!",
      user: { name: "Michael Chen" },
      rating: 5,
      position: "Product Manager at Microsoft"
    },
    {
      text: "From beginner to expert in just 6 months. The learning path was perfect for my goals.",
      user: { name: "Emily Rodriguez" },
      rating: 5,
      position: "UX Designer at Spotify"
    },
    {
      text: "The hands-on projects and real-world applications made all the difference in my learning journey.",
      user: { name: "David Kumar" },
      rating: 5,
      position: "Data Scientist at Netflix"
    }
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What our learners{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              say about us
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their careers with Brainnest
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          setApi={() => {}}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="w-full -ml-4">
            {displayTestimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                <Card className="h-80 border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                  <CardContent className="p-8 h-full flex flex-col">
                    <div className="mb-6">
                      <Quote className="w-8 h-8 text-blue-200 mb-4" />
                      <p className="text-gray-700 leading-relaxed line-clamp-4">
                        {testimonial.text}
                      </p>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < (testimonial.rating || 5) 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }`} 
                          />
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {(testimonial.user?.name || testimonial.name || "User").charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {testimonial.user?.name || testimonial.name || "Anonymous"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {testimonial.position || "Verified Learner"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </div>
    </section>
  );
}