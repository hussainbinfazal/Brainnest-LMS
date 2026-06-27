import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken, ISessionUser, User, UserToken } from "@repo/shared";
import { connectDB } from "@repo/shared";
import { IUser } from "@/types/model";
import { logger } from "@/utils/logger/logger.node";
import { IUserToken } from "@/types/model";
import { CustomNextRequest } from "@/types/server";
import crypto from "crypto";




export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        await connectDB(process.env.MONGODB_URI!);
        const { token } = await request.json();
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");
        let unverifyToken = await UserToken.findOne({ token: hashedToken, type: "reset", expiresAt: { $gt: Date.now() }, isUsed: false },).exec()

        // logger.info("verifyemail token received",{ token });

        if (!unverifyToken) {
            logger.info("Token not found");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        //Update Token while updating password
        // unverifyToken.isUsed = true;

        return NextResponse.json({
            message: "Reset token is valid",
            success: true
        }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Email verification error:", { message });
        return NextResponse.json({ message: `Error in verifying email ` }, { status: 500 });
    }
}