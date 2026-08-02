import { Skeleton } from '@/components/ui/skeleton';
import React from 'react'

const SectionHeaderSkeleton = ():React.JSX.Element => {
   return (
        <div className="space-y-3 mb-6">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-125 max-w-full" />
        </div>
    );
}

export default SectionHeaderSkeleton
