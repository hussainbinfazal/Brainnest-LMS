import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function CourseIdPageSkeleton(): React.JSX.Element {
    return <main className={cn("w-full bg-brand-white dark:bg-black")}><Skeleton />
    </main>;

}