import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import React from 'react'

const SectionHeaderSkeleton = ({className}: {className?: string}):React.JSX.Element => {
   return (
        <div className={cn("space-y-3 mb-6", className)}>
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-125 max-w-full" />
        </div>
    );
}

export default SectionHeaderSkeleton
