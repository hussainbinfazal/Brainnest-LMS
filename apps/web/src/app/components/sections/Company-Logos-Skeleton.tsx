import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const CompanyLogosSkeleton = (length:number=8) : React.JSX.Element=> {
  return (
    <div className="flex gap-8 justify-center">
    {Array.from({ length }).map((_, i) => (
        <Skeleton
            key={i}
            className="h-10 w-24 rounded-md"
        />
    ))}
</div>
  )
}

export default CompanyLogosSkeleton
