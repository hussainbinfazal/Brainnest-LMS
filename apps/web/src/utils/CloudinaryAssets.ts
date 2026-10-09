
import { logger } from "@repo/shared/server";
import { v2 as cloudinary } from "cloudinary";




export type AssetKind = 'image' | 'video';
export type AssetErrorCode = "DUPLICATE" | "INVALID_LOCATION" | "NOT_FOUND" | "TOO_LARGE" | "MOVE_FAILED";

// Describes one file waiting in the pending folder

export interface PendingAsset {
    publicId: string;
    kind: AssetKind;
    pendingPrefix: string;
    targetPublicId: string;
    maxBytes?: number;
    pendingTag?: string;
}


//Describes one file after a successful move

export interface MovedAsset {
    //original pending pubilc_id (used as the look up key)
    from: string;
    //New public_id
    to: string;
    //Resource type, needed to move it back on rollback
    kind: AssetKind;
    ///HTTPS URL to store in MongoDB
    url: string;
    // Tag that was removed, so rollback can put it back
    tag: string;
}

// Error carrying an HTTP status so the route can map it directly

export class AssetError extends Error {
    // 400 for bad client input, 500 for Cloudinary failures

    status: number;
    code: AssetErrorCode
    constructor(message: string, status: number, code: AssetErrorCode) {
        // Pass the message to the base Error {
        super(message);
        this.status = status;
        this.code = code;
    }
}


function isUnderPrefix(publicId: string, prefix: string): boolean {
    //Force a trailing slash so 'pending-x' does not match 'pending'
    const folder = prefix.endsWith("/") ? prefix : `${prefix}/`;
    // / Reject path tricks and anything outside the folder
    return publicId.startsWith(folder) && !publicId.includes('..')
};



//Validates every asset; prefix first (tree), then existence (network, in parallel)


export async function verifyAssets(assets: PendingAsset[]) {
    ///The same file referenced twice would make the seconds rename fail

    const ids = assets.map((a) => a.publicId)

    //Compare unique count against total count

    if (new Set(ids).size !== ids.length) {
        throw new AssetError("Duplicate publicId", 400, "DUPLICATE");
    }

    // Cheap synchronous checks run before any network call
    for (const asset of assets) {
        //Fail fast on the first bad prefix
        if (!isUnderPrefix(asset.publicId, asset.pendingPrefix)) {
            throw new AssetError(`Invalid public_id prefix`, 400, "INVALID_LOCATION");
        }
    };
    //Existence Check run n parallel instead of one by one

    const checks = await Promise.allSettled(assets.map((asset) => cloudinary.api.resource(asset.publicId, { resource_type: asset.kind })));
    // Any rejected check means the client sent an id that was never uploaded

    for (let i = 0; i < checks.length; i++) {
        // This asset's lookup result
        const check = checks[i];
        // A rejected lookup means the client sent an id that was never uploaded
        if (check.status === "rejected") throw new AssetError(`Asset not found: ${assets[i].publicId}`, 400, "NOT_FOUND");
        // Optional size limit for this asset
        const limit = assets[i].maxBytes;
        // Cloudinary reports the real size in bytes, which the client cannot fake
        if (limit !== undefined && check.value.bytes > limit) {
            throw new AssetError(`File too large: ${assets[i].publicId}`, 400, "TOO_LARGE");
        }
    }
}


export async function rollbackMoves(moved: MovedAsset[]): Promise<void> {
    ///allSettled so one failure does not stop the other rollbacks
    const results = await Promise.allSettled(moved.map(async (m) => {
        await cloudinary.uploader.rename(m.to, m.from, {
            resource_type: m.kind
        })
        // Restore the tag so the cleanup job can still collect it if nobody claims it
        await cloudinary.uploader.add_tag(m.tag, [m.from], { resource_type: m.kind });
    }))

    //Log failures: these are orphaned files a cleanup job must handle 
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            logger.error('Asset rollback failed', { asset: moved[i] })
        }
    })
}

///Move all assets in parallel; if any fail, undoes the ones that succeeded

export async function moveAssets(assets: PendingAsset[]): Promise<Map<string, MovedAsset>> {
    ///Start all renames at once
    const results = await Promise.allSettled(
        assets.map(async (a) => {
            const result = await cloudinary.uploader.rename(a.publicId, a.targetPublicId, {
                resource_type: a.kind, overwrite: false
            })
            const tag = a.pendingTag ?? a.pendingPrefix;
            try {
                // Without this, the 24h cleanup job would delete the file we just claimed
                await cloudinary.uploader.remove_tag(tag, [result.public_id], { resource_type: a.kind });
            } catch (tagError) {
                // A moved but still tagged file is a time bomb, so undo this rename before failing
                await cloudinary.uploader.rename(result.public_id, a.publicId, { resource_type: a.kind });
                // Report this asset as failed
                throw tagError;
            }
            // Return Cloudinary's answer plus the tag we removed
            return { result, tag };
        }))



    //lookup table: pending public_id  -> new public_id
    const moved = new Map<string, MovedAsset>();
    //Scope flag for error check
    let failed = false;

    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            //Remember where the file went and its final URL
            moved.set(assets[i].publicId, {
                from: assets[i].publicId,
                to: r.value.result.public_id,
                kind: assets[i].kind,
                url: r.value.result.secure_url,
                tag: r.value.tag
            })
        } else {
            logger.error("Asset move failed", { asset: assets[i].publicId, error: r.reason })
            failed = true
        }
    })

    //All or nothing : unod partial progress

    if (failed) {
        await rollbackMoves(Array.from(moved.values()));
        throw new AssetError("Asset move failed", 500, "MOVE_FAILED");
    }
    ///Everything moved Successfully
    return moved
}