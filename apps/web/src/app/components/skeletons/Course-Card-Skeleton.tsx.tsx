import React, { JSX } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CousrseCardSkeleton:React.FC = ():JSX.Element => {
   return (
    <Card className="overflow-hidden h-87.5">
      <CardContent className="p-0">
        <Skeleton className="h-44 w-full rounded-none" />
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/5" />

        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default CousrseCardSkeleton
