import { auth } from "@/auth";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getErrorMessage } from "@repo/shared";
import { checkIp, connectDB, ISessionUser, IUser, logger, UPDATE_TO_INSTRUCTOR_IP_KEY, User, validateMongooseId } from "@repo/shared/server";
import { Session } from "next-auth";
import { NextRequest } from "next/server";


export async function PUT(request: NextRequest, context: { params: { userId: string } }) {
    const params = await context.params;
    const paramsUserId = Array.isArray(params.userId)
        ? params.userId[0]
        : params.userId;  //Store States
    try {
        const authSession: Session | null = await auth(); //Validate User Session 
        if (!authSession?.user.id) return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true);
        if (validateMongooseId({ userId: paramsUserId })) return failResponse({ message: "Invalid User" }, 400, undefined, undefined, true);
        const authUser: ISessionUser = authSession.user;
        const authUserId = authUser.id;



        const { allowed, remaining, retryAfterSec, ip } = await checkIp(request, UPDATE_TO_INSTRUCTOR_IP_KEY.namespace, UPDATE_TO_INSTRUCTOR_IP_KEY.max, UPDATE_TO_INSTRUCTOR_IP_KEY.windowSec); //Rate Limiting

        if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec), "Remaining-Attempts": String(remaining) }, true);
        if (authUserId !== paramsUserId) return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true);
        await connectDB(process.env.MONGODB_URI);
        const updatedUser: | null = await User.findByIdAndUpdate(paramsUserId, { role: "instructor" }, { new: true });
        if (!updatedUser) return failResponse({ message: "User not found" }, 404, undefined, undefined, true);
        logger.info("User's Role updated successfully", { userId: paramsUserId });
        let data: Record<any, any> = {
            updatedUser
        };
        return successResponse(data, 200, "User updated successfully", undefined, true);
    } catch (error: unknown) {
        const message = getErrorMessage(error, "Error in updating user role on server");
        logger.error(`Error in updating user :`, { message, error });
        return failResponse({ message }, 500, undefined, undefined, true);
    }
}