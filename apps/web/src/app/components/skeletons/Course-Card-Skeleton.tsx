import React, { JSX } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

interface CourseCardSkeletonProps {
  cardClassName?: string;
  cardContentClassName?: string;
  skeletonClassName?: string;
  cardFooterClassName?: string;
  cardFooterChildClassName?: string;
  cardFooterSkeletonClassName?: string;
}
const CourseCardSkeleton:React.FC <CourseCardSkeletonProps> = ({cardClassName, cardContentClassName, skeletonClassName, cardFooterClassName, cardFooterChildClassName, cardFooterSkeletonClassName}: CourseCardSkeletonProps):JSX.Element => {
   return (
    <Card className={cn("overflow-hidden h-87.5", cardClassName)}>
      <CardContent className={cn("p-0", cardContentClassName)}>
        <Skeleton className={cn("h-44 w-full rounded-none skeleton-shimmer", skeletonClassName)} />
      </CardContent>

      <CardFooter className={cn("flex flex-col items-start gap-3 p-4", cardFooterClassName)}>
        <Skeleton className={cn("h-5 w-4/5 skeleton-shimmer", cardFooterSkeletonClassName)} />
        <Skeleton className={cn("h-4 w-2/5 skeleton-shimmer", cardFooterSkeletonClassName)} />

        <div className={cn("flex gap-2", cardFooterChildClassName)}>
          <Skeleton className={cn("h-6 w-16 rounded-full skeleton-shimmer", cardFooterSkeletonClassName)} />
          <Skeleton className={cn("h-6 w-20 rounded-full skeleton-shimmer", cardFooterSkeletonClassName)} />
        </div>
      </CardFooter>
    </Card>
  );
}

export default CourseCardSkeleton
