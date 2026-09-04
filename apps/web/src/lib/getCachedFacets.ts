import { IFacets } from "@/types/server";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { connectDB, Course, ICategory, logger } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";



export async function getCachedFacets(): Promise<IFacets> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const cached = await getCached<IFacets>(`courses-facets`, "category:language:level");
        if (cached) {
            return cached;
        }
        const facets: IFacets[] = await Course.aggregate([
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
            const data: IFacets = {
                categories: facets[0].categories,
                languages: facets[0].languages,
                levels: facets[0].levels,
            };
            const serializedFacets = serializeDocument(data);
            await setCached<IFacets>(`courses-facets`, "category:language:level", serializedFacets, CACHE_TTL.VERY_LONG);
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