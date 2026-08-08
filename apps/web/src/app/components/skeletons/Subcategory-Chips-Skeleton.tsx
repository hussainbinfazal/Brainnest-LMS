import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils';
import React from 'react'

interface SubcategoryChipsSkeletonProps {
  length?: number;
  className?: string;
  skeletonClassName?: string;
}

const SubcategoryChipsSkeleton = ({length=6, className, skeletonClassName}: SubcategoryChipsSkeletonProps):React.JSX.Element => {
  return (
    <div className={cn("flex gap-3 mt-6", className)}>
    {Array.from({ length }).map((_, i) => (
        <Skeleton
            key={i}
            className={cn("h-9 w-24 rounded-full skeleton-shimmer")}
        />
    ))}
</div>
  )
}

export default SubcategoryChipsSkeleton
