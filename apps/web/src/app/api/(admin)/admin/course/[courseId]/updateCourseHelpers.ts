import { diffDocuments } from "@/lib/helpers/genericDiff";
import { toSlug } from "@repo/shared";
import { Category, Lesson, logger, Section, Topic } from "@repo/shared/server";
import { ClientSession, Types } from "mongoose";

export class RequestError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status
    }
}

export const isPendingId = (
    publicId: string | undefined,
    prefix: string,

): publicId is string => !!publicId && publicId.startsWith(prefix);

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export async function resolveCategory(session: ClientSession, parentRaw: string, subRaw: string): Promise<Types.ObjectId> {
    try {
        const parentName = parentRaw.trim().charAt(0).toUpperCase() + parentRaw.trim().slice(1).toLowerCase();
        const subName = subRaw.trim().charAt(0).toUpperCase() + subRaw.trim().slice(1).toLowerCase();
        const parent = await Category.findOneAndUpdate({
            name: parentName,
            parent: null
        }, {
            $setOnInsert: { name: parentName, slug: toSlug(parentName) },
            parent: null,
        }, {
            upsert: true,

            returnDocument: 'after', session
        });
        const sub = await Category.findOneAndUpdate({ name: subName, parent: parent._id }, {
            $setOnInsert: { name: subName, slug: toSlug(subName), parent: parent._id },
        }, {
            upsert: true, returnDocument: 'after', session
        })
        return sub._id;
    } catch (resolveCategoryError: any) {
        logger.error("This is the error in resolve Category", { resolveCategoryError })
        throw resolveCategoryError
    }
};


export async function resolveTopic(session: ClientSession, topics: { name: string; description?: string }[]): Promise<Types.ObjectId[]> {
    try {
        const byKey = new Map<string, { name: string; description: string }>();
        topics.forEach((t) => byKey.set(t.name.trim().toLowerCase(),
            {
                name: t.name.trim(),
                description: t.description ?? '',
            }
        ));

        const clean = [...byKey.values()];

        if (clean.length === 0) return [];
        await Topic.bulkWrite(
            clean.map((t) => ({
                updateOne: {
                    filter: { name: t.name },
                    update: {
                        $setOnInsert: {
                            name: t.name,
                            description: t.description,
                            slug: toSlug(t.name),
                            isActive: true,
                        }
                    },
                    upsert: true,
                    new: true,
                },
            })),
            { session }
        );
        const topicDocs = await Topic.find({ name: { $in: clean.map((t) => t.name) } })
            .select("_id")
            .session(session)
            .lean();
        return topicDocs.map((t) => t._id as Types.ObjectId);
    } catch (topicError: any) {
        logger.error("This is the error in resolve Topic", { topicError })
        throw topicError
    }
};


export type PlannedSection = {
    _id: Types.ObjectId;
    courseId: Types.ObjectId;
    title: string;
    description: string;
    order: number;
};

export type Lessonfields = {
    //Title
    name?: string;
    description?: string;
    order?: number;
    durationInSeconds?: number,
    videoUrl?: string;
    isPreview?: boolean;
    previewUrl?: string;
    previewDurationInSeconds?: number;
}
export type PlannedLesson = {
    //Title
    _id: Types.ObjectId;
    courseId: Types.ObjectId;
    sectionId: Types.ObjectId;
    fields: Lessonfields
}

export async function syncSections(
    session: ClientSession,
    courseId: Types.ObjectId,
    existingSections: PlannedSection[],
    incoming: PlannedSection[]
): Promise<void> {
    try {
        const plan = diffDocuments(existingSections, incoming, ['title', 'description', 'order']);

        // New sections first, so lessons can reference them
        if (plan.toInsert.length) {
            await Section.insertMany(plan.toInsert, { session })
        }
        if (plan.toUpdate.length) {
            await Section.bulkWrite(
                plan.toUpdate.map((s) => ({
                    updateOne: {
                        filter: { _id: s._id, courseId },
                        update: {
                            $set: {
                                title: s.title,
                                description: s.description,
                                order: s.order
                            }
                        }
                    }
                })),
                { session }
            )
        };
        // Sections missing from the payload are removed
        if (plan.toDelete.length) {
            // Scoped to this course for safety
            await Section.deleteMany(
                { _id: { $in: plan.toDelete }, courseId },
                { session }
            );
        };
    } catch (syncSectionError: any) {
        logger.error("This is the error in sync Section", { syncSectionError })
        throw syncSectionError;
    }
}
type FlatLesson = Lessonfields & {
    // Lesson id
    _id: Types.ObjectId
    // Owning course
    courseId: Types.ObjectId
    // Owning section
    sectionId: Types.ObjectId
}
// Nested PlannedLesson -> flat doc
const flatten = (l: PlannedLesson): FlatLesson => ({
    // Identity fields
    _id: l._id, courseId: l.courseId, sectionId: l.sectionId,
    // Editable fields (already stripped of undefined)
    ...l.fields,
})
export async function syncLessons(
    session: ClientSession,
    courseId: Types.ObjectId,
    existingLessons: PlannedLesson[],
    incoming: PlannedLesson[]
): Promise<void> {
    try {// Old versions by id string
        const oldById = new Map(existingLessons.map((l) => [l._id.toString(), l]))
        // Existing lessons as flat docs
        const flatExisting = existingLessons.map(flatten)
        // Final state: DB values first, client changes on top, so partial payloads keep their old fields
        const flatIncoming: FlatLesson[] = incoming.map((l) => {
            // The DB version, if this lesson already exists
            const old = oldById.get(l._id.toString())
            // Merge old under new
            return { ...(old ? flatten(old) : {}), ...flatten(l) } as FlatLesson
        })
        const plan = diffDocuments(flatExisting, flatIncoming, ["sectionId", "name", "description", "order", "durationInSeconds",
            "isPreview", "videoUrl", "previewUrl", "previewDurationInSeconds",]);
        if (plan.toInsert.length) {
            await Lesson.insertMany(plan.toInsert.map((l) => (
                {
                    _id: l._id,
                    courseId: l.courseId,
                    sectionId: l.sectionId,
                    name: l.name,
                    description: l.description,
                    order: l.order,
                    durationInSeconds: l.durationInSeconds,
                    isPreview: l.isPreview,
                    videoUrl: l.videoUrl,
                    previewUrl: l.previewUrl,
                    previewDurationInSeconds: l.previewDurationInSeconds
                }
            )),
                { session }

            )
        };
        if (plan.toUpdate.length) {
            await Lesson.bulkWrite(
                plan.toUpdate.map((l) => ({
                    updateOne: {
                        filter: { _id: l._id, courseId },
                        update: {
                            $set: {
                                sectionId: l.sectionId,
                                name: l.name,
                                description: l.description,
                                order: l.order,
                                durationInSeconds: l.durationInSeconds,
                                isPreview: l.isPreview,
                                videoUrl: l.videoUrl,
                                previewUrl: l.previewUrl,
                                previewDurationInSeconds: l.previewDurationInSeconds
                            }
                        }

                    },
                })),
                { session }
            )
            if (plan.toDelete.length) {
                await Lesson.deleteMany(
                    { _id: { $in: plan.toDelete }, courseId },
                    { session }
                )
            };
        }
    } catch (syncLessonError: any) {
        logger.error("This is the error in sync Lesson", { syncLessonError })
        throw syncLessonError;
    }
};

export async function computeTotals(
    session: ClientSession,
    courseId: Types.ObjectId
): Promise<{ totalDurationInSeconds: number, totalLessons: number }> {
    try {
        const [row] = await Lesson.aggregate<
            {
                totalDurationInSeconds: number,
                totalLessons: number
            }>([
                { $match: { courseId } },
                {
                    $group: {
                        _id: null,
                        totalDurationInSeconds: { $sum: '$durationInSeconds' },
                        totalLessons: { $sum: 1 }
                    }
                }
            ]).session(session)
        return { totalDurationInSeconds: row?.totalDurationInSeconds ?? 0, totalLessons: row?.totalLessons ?? 0 }
    } catch (computeTotalError: any) {
        logger.error("This is the error in computeTotal", { computeTotalError })
        throw computeTotalError
    }
}



