import HeroBannerSkeleton from "../skeletons/HeroBanner-Skeleton";
import SectionHeaderSkeleton from "../skeletons/Section-Header-Skeleton";
import TabsSkeleton from "../skeletons/Tabs-Skeleton";
import CategoryChipsSkeleton from "../skeletons/Category-Chips-Skeleton";
import SubcategoryChipsSkeleton from "../skeletons/Subcategory-Chips-Skeleton";
import { CategoryCarouselSkeleton, CourseCarouselSkeleton } from "../skeletons/Carousel-Skeletons";
import CompanyLogosSkeleton from "../skeletons/Company-Logos-Skeleton";
import { ReviewCardBackgroundSkeleton } from "../skeletons/Review-Card-Skeleton";

import {
  Carousel,
  CarouselContent,
} from "@/components/ui/carousel";

export default function HomePageSkeleton(): React.JSX.Element {
  return (
    <main className="w-full bg-brand-white dark:bg-black justify-center">

      {/* Hero */}
      <section className="flex justify-center py-8">
        <div className="w-[90%] xl:max-w-[75%]">
          <HeroBannerSkeleton />
        </div>
      </section>

      {/* Ready to imagine */}
      <section className="flex justify-center py-16">
        <div className="w-[90%] 2xl:max-w-[75%]">
          <SectionHeaderSkeleton />

          <Carousel className="mt-8">
            <CarouselContent>
              <CourseCarouselSkeleton length={6} className={"w-full basis-1/5"} />
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* Skills */}
      <section className="flex justify-center py-16">
        <div className="w-[90%] 2xl:max-w-[75%]">

          <SectionHeaderSkeleton />

          <TabsSkeleton className="mt-6" />

          <SubcategoryChipsSkeleton className="mt-8" />

          <Carousel className="mt-8">
            <CarouselContent>
              <CourseCarouselSkeleton length={6} className={"w-full basis-1/5"} />
            </CarouselContent>
          </Carousel>

        </div>
      </section>

      {/* Popular Categories */}
      <section className="flex justify-center py-16">
        <div className="w-[90%] xl:max-w-[75%]">

          <SectionHeaderSkeleton />

          <Carousel className="mt-8 w-full">
            <CarouselContent>
              <CategoryCarouselSkeleton length={6} className={"w-full"} />
            </CarouselContent>
          </Carousel>

        </div>
      </section>

      {/* Company Logos */}
      <section className="py-16">
        <CompanyLogosSkeleton />
      </section>

      {/* Reviews */}
      <section className="flex justify-center py-16">
        <div className="w-[90%] xl:max-w-[75%]">

          <SectionHeaderSkeleton />

          <ReviewCardBackgroundSkeleton className="mt-8" />

        </div>
      </section>

    </main>
  );
}