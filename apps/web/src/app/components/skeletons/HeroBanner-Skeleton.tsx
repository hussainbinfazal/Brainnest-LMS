import { Skeleton } from '@/components/ui/skeleton'
import React, { JSX } from 'react'

const HeroBannerSkeleton = () : React.JSX.Element => {
  return (
    <div className="relative overflow-hidden rounded-xl">
    <Skeleton className="h-105 w-full skeleton-shimmer" />

    <div className="absolute left-12 top-12 space-y-4">
        <Skeleton className="h-10 w-80 skeleton-shimmer" />
        <Skeleton className="h-5 w-60 skeleton-shimmer" />
        <Skeleton className="h-10 w-40 rounded-md skeleton-shimmer" />
    </div>
</div>
  )
}

export default HeroBannerSkeleton
