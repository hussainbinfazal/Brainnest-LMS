import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils';
import React from 'react'
interface CompanyLogosSkeletonProps {
  length?: number;
  className?: string;
  skeletonClassName?: string;
}

const CompanyLogosSkeleton = ({length=8, className, skeletonClassName }: CompanyLogosSkeletonProps): React.JSX.Element=> {
  return (
    <div className={cn("flex gap-8 justify-center", className)}>
    {Array.from({ length }).map((_, i) => (
        <Skeleton
            key={i}
            className={cn("h-10 w-24 rounded-md", skeletonClassName)}
        />
    ))}
</div>
  )
}

export default CompanyLogosSkeleton
