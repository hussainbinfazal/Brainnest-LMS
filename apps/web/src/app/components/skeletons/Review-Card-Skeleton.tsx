import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react'

const ReviewCardSkeleton:React.FC = ():React.JSX.Element => {
  return (
    <Card className="h-70">
      <CardContent className="space-y-3 pt-6">
        <Skeleton className="h-4 w-full skeleton-shimmer" />
        <Skeleton className="h-4 w-full skeleton-shimmer" />
        <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
      </CardContent>

      <CardFooter className="flex gap-3">
        <Skeleton className="h-12 w-12 rounded-full skeleton-shimmer" />

        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 skeleton-shimmer" />
          <Skeleton className="h-3 w-20 skeleton-shimmer" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default ReviewCardSkeleton
