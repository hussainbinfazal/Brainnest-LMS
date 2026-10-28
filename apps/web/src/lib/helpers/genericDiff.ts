import { Types } from "mongoose"

type Diffable = { _id?: string | Types.ObjectId }
type DiffResult<T> = {
    toInsert: T[],
    toDelete: string[],
    toUpdate: T[]
}
// Duck-typed on purpose: in a monorepo two copies of mongoose break `instanceof`
const isObjectId = (v: unknown): boolean => typeof v === 'object' && v !== null && (v as { _bsontype?: string })._bsontype === 'ObjectId'

const isSame = (a: unknown, b: unknown): boolean => {
    ///Compare ids by their hex string
    if (isObjectId(a) || isObjectId(b)) return String(a) === String(b)
    // Compare Timestamps
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    // Primitives: Object.is
    return Object.is(a, b)
}
export function diffDocuments<TExisting extends Diffable, TIncoming extends Diffable>(
    existingDocs: TExisting[],
    incomingDocs: TIncoming[],
    compareFields: (keyof TExisting & keyof TIncoming)[]
): DiffResult<TIncoming> {
    const existingMap = new Map(
        existingDocs.map((doc) => [doc._id!.toString() as string, doc])
    )
    const incomingMap = new Map(
        incomingDocs.filter(doc => doc._id).map((doc) => [doc._id!.toString() as string, doc])

    )
    const toInsert: TIncoming[] = []
    const toUpdate: TIncoming[] = []
    const toDelete: string[] = []

    for (const doc of incomingDocs) {
        if (!doc._id) {
            toInsert.push(doc)
            continue
        }
        const existingDoc = existingMap.get(doc._id.toString() as string);
        if (!existingDoc) {
            toInsert.push(doc)
            continue
        }
        // let changed = false
        // for (const field of compareFields) {
        //     if (!Object.is(existingDoc[field], doc[field])) {
        //         changed = true
        //         break
        //     };
        // }
        if (compareFields.some((f) => !isSame(existingDoc[f], doc[f]))) {
            // Queue the update
            toUpdate.push(doc)
        }
        // if (changed) {
        //     toUpdate.push(doc)
        // }
    };
    for (const existing of existingDocs) {
        if (existing._id && !incomingMap.has(existing._id.toString())) {
            toDelete.push(existing._id.toString())
        }
    };
    return { toInsert, toDelete, toUpdate }

}