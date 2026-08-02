import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React, { JSX } from 'react'

const CategoryCardSkeleton:React.FC = (): JSX.Element => {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="flex items-center justify-center h-52">
        <Skeleton className="h-28 w-28 rounded-xl" />
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-36" />
      </CardFooter>
    </Card>
  );
}

export default CategoryCardSkeleton
