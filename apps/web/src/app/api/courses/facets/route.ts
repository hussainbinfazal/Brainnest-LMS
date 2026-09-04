import { CustomNextRequest } from "@/types/server";
import { serializeDocument } from "@/utils/serializer/serializeDocument";
import { connectDB, Course, ICategory, logger } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { NextResponse } from "next/server";


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
export async function GET(request: CustomNextRequest, response: NextResponse): Promise<NextResponse> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const cached = getCached(`facets`, "category:language:level");
        if (cached) {
            return NextResponse.json({ message: "Facets data grouped successfully", data: cached }, { status: 200 });
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
            const data = {
                categories: facets[0].categories,
                languages: facets[0].languages,
                levels: facets[0].levels,
            };
            const serializedFacets = serializeDocument(data);
            await setCached<Facets>(`facets`, "category:language:level", serializedFacets, CACHE_TTL.VERY_LONG);
            return NextResponse.json({ success: true, serializedFacets }, { status: 200 });
        }
        return NextResponse.json({ success: true, data: [] }, { status: 200 })
    } catch (
    error: unknown
    ) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        logger.error("Error in fetching facets", { message });
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


// {
//   categories: [ { _id: catA, count: 2, category: [{name: "Dev", ...}] }, { _id: catB, count: 1, category: [...] } ],
//   languages: [ { _id: "English" }, { _id: "Hindi" } ],
//   levels: [ { _id: "Beginner" }, { _id: "Advanced" } ]
// }