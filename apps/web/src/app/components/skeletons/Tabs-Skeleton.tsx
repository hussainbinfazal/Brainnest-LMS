import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const TabsSkeleton = (length:number=7): React.JSX.Element => {
  return (
    <div className="flex gap-3 overflow-hidden">
    {Array.from({ length }).map((_, i) => (
        <Skeleton
            key={i}
            className="h-10 w-28 rounded-full"
        />
    ))}
</div>
  )
}

export default TabsSkeleton
