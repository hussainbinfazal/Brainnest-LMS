import { ICourse, IReview } from "../model";
export interface CourseAggregationResult {
    courseData: ICourse[];
    reviews: IReview[];
    reviewCount: {
        count: {
            totalReviews: number;
        }[];
    }[];
    instructorStats: {
        totalCourses: number;
        totalEnrolled: number;
        totalReviews: number;
        totalRatings: number;
    }[];
}
//# sourceMappingURL=aggregation.d.ts.map