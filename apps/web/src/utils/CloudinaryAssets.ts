
import { logger } from "@repo/shared/server";
import { v2 as cloudinary } from "cloudinary";




export type AssetKind = 'image' | 'video';

// Describes one file waiting in the pending folder

export interface PendingAsset {
    publicId: string;
    kind: AssetKind;
    pendingPrefix: string;
    targetPublicId: string;
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
}

// Error carrying an HTTP status so the route can map it directly

export class AssetError extends Error {
    // 400 for bad client input, 500 for Cloudinary failures

    status: number;
    constructor(message: string, status: number) {
        // Pass the message to the base Error {
        super(message);
        this.status = status;
    }
}


function isUnderPrefix(publicId: string, prefix: string): boolean {
    //Force a trailing slash so 'pending-x' does not match 'pending'
    const folder = prefix.endsWith("/") ? prefix : `${prefix}/`;
    // / Reject path tricks and anything outside the folder
    return publicId.startsWith(folder) && !publicId.includes('..')
};



//Validates every asset; prefix first (tree), then existence (network, in parallel)

export async function verfyAssets(assets: PendingAsset[]) {
    ///The same file referenced twice would make the seconds rename fail

    const ids = assets.map((a) => a.publicId)

    //Compare unique count against total count

    if (new Set(ids).size !== ids.length) {
        throw new AssetError("Duplicate publicId", 400);
    }

    // Cheap synchronous checks run before any network call
    for (const asset of assets) {
        //Fail fast on the first bad prefix
        if (!isUnderPrefix(asset.publicId, asset.pendingPrefix)) {
            throw new AssetError(`Invalid public_id prefix`, 400);
        }
    };
    //Existence Check run n parallel instead of one by one

    const checks = await Promise.allSettled(assets.map((asset) => cloudinary.api.resource(asset.publicId, { resource_type: asset.kind })));
    // Any rejected check means the client sent an id that was never uploaded

    const missing = checks.findIndex((r) => r.status === 'rejected');
    ///Some asset is missing
    if (missing !== -1) {
        throw new AssetError(`Invalid public_id ${assets[missing].publicId}`, 400);
    }
}


export async function rollbackMoves(moved: MovedAsset[]): Promise<void> {
    ///allSettled so one failure does not stop the other rollbacks
    const results = await Promise.allSettled(moved.map((m) => cloudinary.uploader.rename(m.to, m.from, {
        resource_type: m.kind
    })));

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
        assets.map((a) => cloudinary.uploader.rename(a.publicId, a.targetPublicId, {
            resource_type: a.kind, overwrite: false
        }))

    )

    //lookup table: pending public_id  -> new public_id
    const moved = new Map<string, MovedAsset>();
    //Scope flag for error check
    let failed = false;

    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            //Remember where the file went and its final URL
            moved.set(assets[i].publicId, {
                from: assets[i].publicId,
                to: r.value.public_id,
                kind: assets[i].kind,
                url: r.value.secure_url
            })
        } else {
            logger.error("Asset move failed", { asset: assets[i].publicId, error: r.reason })
            failed = true
        }
    })

    //All or nothing : unod partial progress

    if (failed) {
        await rollbackMoves(Array.from(moved.values()));
        throw new AssetError("Asset move failed", 500);
    }
    ///Everything moved Successfully
    return moved
}