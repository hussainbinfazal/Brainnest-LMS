import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { connectDB, Course, ICategory, logger } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";


type Facets = {
    categories: {
        _id: string;
        count: number;
        category: ICategory[];
    }[];
    languages: {
        _id: string;
    }[];
    levels: {
        _id: string;
    }[];
}
export async function getCachedFacets(): Promise<Facets> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const cached = await getCached<Facets>(`facets`, "category:language:level");
        if (cached) {
            return cached;
        }
        const facets: Facets[] = await Course.aggregate([
            {
                $facet: {
                    categories: [
                        { $group: { _id: "$category", count: { $sum: 1 } } },
                        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
                    ],
                    //[{_id:"category id",count:1},{category:[{name:"category name",_id:"category id"}]}]
                    languages: [{ $group: { _id: "$language" } }], //["english","Hindi"]
                    levels: [{ $group: { _id: "$level" } }], //["beginner","intermediate","expert"]

                }
            }
        ]);

        if (facets.length) {
            const data: Facets = {
                categories: facets[0].categories,
                languages: facets[0].languages,
                levels: facets[0].levels,
            };
            const serializedFacets = serializeDocument(data);
            await setCached<Facets>(`facets`, "category:language:level", serializedFacets, CACHE_TTL.VERY_LONG);
            return serializedFacets
        } else {
            return { categories: [], languages: [], levels: [] }
        }
    } catch (
    error: unknown
    ) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error in fetching facets", { message });
        return { categories: [], languages: [], levels: [] }
    }
}