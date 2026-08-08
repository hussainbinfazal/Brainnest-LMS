import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import React from 'react'

interface TabsSkeletonProps {
  length?: number;
  className?: string;
  skeletonClassName?: string;
}
const TabsSkeleton = (props: TabsSkeletonProps): React.JSX.Element => {
  const { length = 7, className, skeletonClassName } = props;
  return (
    <div className={cn("flex gap-3 overflow-hidden skeleton-shimmer",className)}>
    {Array.from({ length }).map((_, i) => (
        <Skeleton
            key={i}
            className={cn("h-10 w-28 rounded-full", skeletonClassName)}
        />
    ))}
</div>
  )
}

export default TabsSkeleton
