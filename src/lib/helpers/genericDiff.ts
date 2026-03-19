import { Types } from "mongoose"

interface DiffResult<T> {
    toInsert: T[],
    toDelete: string[],
    toUpdate: T[]
}

export function diffDocuments<T extends { _id?: string | Types.ObjectId }>(
    existingDocs: T[],
    incomingDocs: T[],
    compareFields: (keyof T)[]
): DiffResult<T> {
    const existingMap = new Map(
        existingDocs.map((doc) => [doc._id!.toString() as string, doc])
    )
    const incomingMap = new Map(
        incomingDocs.filter(doc => doc._id).map((doc) => [doc._id!.toString() as string, doc])

    )
    const toInsert: T[] = []
    const toUpdate: T[] = []
    const toDelete: string[] = []

    for (const doc of incomingDocs) {
        if (!doc._id) {
            toInsert.push(doc)
            continue
        }
        const existingDoc = existingMap.get(doc._id.toString() as string)
        if (!existingDoc) {
            toInsert.push(doc)
            continue
        }
        let changed = false
        for (const field of compareFields) {
            if (existingDoc[field] !== doc[field]) {
                changed = true
                break
            }
        }
        if (changed) {
            toUpdate.push(doc)
        }
        for (const existing of existingDocs) {
            if (!incomingMap.has(existing._id!.toString())) {
                toDelete.push(existing._id!.toString())
            }
        }

    }
    return { toInsert, toDelete, toUpdate }

}