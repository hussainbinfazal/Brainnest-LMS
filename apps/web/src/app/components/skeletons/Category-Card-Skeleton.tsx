import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import React, { JSX } from 'react'

interface CategoryCardSkeletonProps {
  cardClassName?: string;
  cardContentClassName?: string;
  skeletonClassName?: string;
  cardFooterClassName?: string;
  cardFooterSkeletonClassName?: string;
}
const CategoryCardSkeleton:React.FC = ({cardClassName, cardContentClassName, skeletonClassName, cardFooterClassName, cardFooterSkeletonClassName}: CategoryCardSkeletonProps): JSX.Element => {
  return (
    <Card className={cn("border-0 shadow-none", cardClassName)}>
      <CardContent className={cn("flex items-center justify-center h-52", cardContentClassName)}>
        <Skeleton className={cn("h-38 w-38 rounded-xl skeleton-shimmer", skeletonClassName)} />
      </CardContent>

      <CardFooter className={cn("flex flex-col gap-2", cardFooterClassName)}>
        <Skeleton className={cn("h-5 w-28 skeleton-shimmer", cardFooterSkeletonClassName)} />
      </CardFooter>
    </Card>
  );
}

export default CategoryCardSkeleton
