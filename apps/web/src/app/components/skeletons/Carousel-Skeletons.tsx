import { CarouselItem } from '@/components/ui/carousel'
import React from 'react'
import CategoryCardSkeleton from './Category-Card-Skeleton'
import CousrseCardSkeleton from './Course-Card-Skeleton'
import { cn } from '@/lib/utils';


interface CousrseCardSkeletonProps {
  length?: number;
  className?: string;
}
interface CategoryCardSkeletonProps {
  length?: number;
  className?: string;
}
export const CategoryCarouselSkeleton = ({length=8,className}: CategoryCardSkeletonProps): React.JSX.Element => {
  return (
    <div className={cn("flex gap-4", className)}>{Array.from({ length }).map((_, i) => (
    <CarouselItem
        key={i}
        className="basis-full sm:basis-1/2 md:basis-1/3 xl:basis-1/5"
    >
        <CategoryCardSkeleton />
    </CarouselItem>
))}</div>
  )
}

export const CourseCarouselSkeleton = ({length=8,className}: CousrseCardSkeletonProps): React.JSX.Element => {
    return (
        <div className={cn("flex gap-2", className)}>{Array.from({ length }).map((_, i) => (
            <CarouselItem
            key={i}
            className="basis-full sm:basis-1/2 md:basis-1/3 xl:basis-1/4"
            >
        <CousrseCardSkeleton />
    </CarouselItem>
))}</div>
)
}


