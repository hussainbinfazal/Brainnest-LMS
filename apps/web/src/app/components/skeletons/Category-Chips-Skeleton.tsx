import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils';
import React from 'react'

interface CategoryChipsSkeletonProps {
  length?: number;
  className?: string;
  skeletonClassName?: string;
}

const CategoryChipsSkeleton = ({length=6, className, skeletonClassName}: CategoryChipsSkeletonProps):React.JSX.Element => {
  return (
    <div className={cn("flex gap-3 mt-6", className)} >
    {Array.from({ length }).map((_, i) => (
        <Skeleton
            key={i}
            className={cn("h-9 w-24 rounded-full skeleton-shimmer", skeletonClassName)}
        />
    ))}
</div>
  )
}

export default CategoryChipsSkeleton
