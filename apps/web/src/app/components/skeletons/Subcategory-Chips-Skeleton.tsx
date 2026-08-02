import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const SubcategoryChipsSkeleton = ():React.JSX.Element => {
  return (
    <div className="flex gap-3 mt-6 " >
    {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
            key={i}
            className="h-9 w-24 rounded-full skeleton-shimmer"
        />
    ))}
</div>
  )
}

export default SubcategoryChipsSkeleton
