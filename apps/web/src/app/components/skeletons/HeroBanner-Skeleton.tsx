import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import React, { JSX } from 'react'


const HeroBannerSkeleton = ({className, skeletonClassName}: {className?: string, skeletonClassName?: string}) : React.JSX.Element => {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
    <Skeleton className={cn("h-105 w-full skeleton-shimmer bg-slate-200", skeletonClassName)} />

    {/* <div className="absolute left-12 top-12 space-y-4">
        <Skeleton className="h-40 w-60 rounded-xl skeleton-shimmer"/>
        <Skeleton className="h-10 w-60 skeleton-shimmer" />
        <Skeleton className="h-10 w-40  rounded-full skeleton-shimmer" />
        
    </div> */}
</div>
  )
}

export default HeroBannerSkeleton
