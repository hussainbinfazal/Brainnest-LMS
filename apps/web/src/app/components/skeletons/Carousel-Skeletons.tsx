import { CarouselItem } from '@/components/ui/carousel'
import React from 'react'
import CategoryCardSkeleton from './Category-Card-Skeleton'

const CarouselSkeleton = (length:number=8): React.JSX.Element => {
  return (
    <div className="flex gap-4">{Array.from({ length }).map((_, i) => (
    <CarouselItem
        key={i}
        className="basis-full sm:basis-1/2 md:basis-1/3 xl:basis-1/4"
    >
        <CategoryCardSkeleton />
    </CarouselItem>
))}</div>
  )
}

export default CarouselSkeleton
