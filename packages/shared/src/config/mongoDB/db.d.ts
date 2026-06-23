import mongoose from "mongoose";
declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    } | undefined;
}
export declare const connectDB: (mongoDbUrl?: string) => Promise<typeof mongoose>;
//# sourceMappingURL=db.d.ts.map