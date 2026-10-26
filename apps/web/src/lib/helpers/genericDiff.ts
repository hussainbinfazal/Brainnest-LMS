import { Types } from "mongoose"

type Diffable = { _id?: string | Types.ObjectId }
type DiffResult<T> = {
    toInsert: T[],
    toDelete: string[],
    toUpdate: T[]
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
        const existingDoc = existingMap.get(doc._id.toString() as string)
        if (!existingDoc) {
            toInsert.push(doc)
            continue
        }
        let changed = false
        for (const field of compareFields) {
            if (!Object.is(existingDoc[field], doc[field])) {
                changed = true
                break
            }
        }
        if (changed) {
            toUpdate.push(doc)
        }
    }

    for (const existing of existingDocs) {
        if (existing._id && !incomingMap.has(existing._id.toString())) {
            toDelete.push(existing._id.toString())
        }
    }

    return { toInsert, toDelete, toUpdate }

}