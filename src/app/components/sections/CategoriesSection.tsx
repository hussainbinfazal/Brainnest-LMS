"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getCategoryImagePath } from "@/app/components/getCategoryImagePath";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EmblaOptionsType } from "embla-carousel";
import { useState } from "react";
import { carouselOptions, CategoriesSectionProps } from "@/types/client";

export default function CategoriesSection({ categories:categories , isLoading: isLoading }: CategoriesSectionProps) {

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <Badge variant="" className="mb-4 bg-green-100 text-green-700 hover:bg-green-200">
            Popular Categories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore by{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Category
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover courses across diverse fields and find your passion
          </p>
        </div>

        <Carousel
          setApi={() => {}}
          plugins={[]}
          opts={carouselOptions}
          className="w-full"
        >
          <CarouselContent className="w-full -ml-4">
            {categories.map((category, index) => {
                const [imgSrc, setImgSrc] = useState(getCategoryImagePath(category));
                return(
                  <CarouselItem key={category} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <Link href="/courses" className="block">
                  <Card className="group h-64 border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <CardContent className="p-0 h-48 relative">
                      <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                        <div className="relative w-20 h-20 group-hover:scale-110 transition-transform duration-300">
                          <Image
                            src={imgSrc}
                            alt={category}
                            fill
                            className="object-contain"
                            onError={(e) => {
                              setImgSrc(`https://via.placeholder.com/80x80/f0f0f0/666666?text=${category.charAt(0)}`);
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 text-center">
                      <div className="w-full">
                        <h3 className="font-semibold text-lg capitalize group-hover:text-blue-600 transition-colors">
                          {category}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Explore courses
                        </p>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </CarouselItem>
                )
              
              })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </div>
    </section>
  );
}