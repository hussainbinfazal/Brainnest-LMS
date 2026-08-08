import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import React from 'react'

interface CategoryCardSkeletonProps {
  cardClassName?: string;
  cardContentClassName?: string;
  skeletonClassName?: string;
  cardFooterClassName?: string;
  cardFooterSkeletonClassName?: string;
}
interface CategoryCardBackgroundSkeletonProps {
  className?: string;
}
export const ReviewCardSkeleton:React.FC<CategoryCardSkeletonProps> = ({cardClassName, cardContentClassName, skeletonClassName, cardFooterClassName, cardFooterSkeletonClassName}: CategoryCardSkeletonProps):React.JSX.Element => {
  return (
    <Card className={cn("h-70", cardClassName)}>
      <CardContent className={cn("space-y-3 pt-6", cardContentClassName)}>
        <Skeleton className={cn("h-4 w-full skeleton-shimmer", skeletonClassName)} />
        <Skeleton className={cn("h-4 w-full skeleton-shimmer", skeletonClassName)} />
        <Skeleton className={cn("h-4 w-3/4 skeleton-shimmer", skeletonClassName)} />
      </CardContent>

      <CardFooter className={cn("flex gap-3", cardFooterClassName)}>
        <Skeleton className={cn("h-12 w-12 rounded-full skeleton-shimmer", cardFooterSkeletonClassName)} />

        <div className="flex-1 space-y-2">
          <Skeleton className={cn("h-4 w-24 skeleton-shimmer", cardFooterSkeletonClassName)} />
          <Skeleton className={cn("h-3 w-20 skeleton-shimmer", cardFooterSkeletonClassName)} />
        </div>
      </CardFooter>
    </Card>
  );
}
export const ReviewCardBackgroundSkeleton = ({className}: CategoryCardBackgroundSkeletonProps):React.JSX.Element => {
  return (
   <div className={cn("flex gap-4 w-full rounded-lg skeleton-shimmer ", className)}>
    {Array.from({ length: 6 }).map((_, i) => (
      <ReviewCardSkeleton cardClassName={"h-80 w-75"} />
    ))}
   </div>
  );
}
  

