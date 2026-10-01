import { NextRequest, NextResponse } from "next/server";
import { checkIp, getCached, invalidateCached, REGISTER_IP_KEY, User, USER_VERIFIED_FLAG} from '@repo/shared/server';
import { connectDB } from '@repo/shared/server';
import bcrypt from "bcryptjs";
import { IUser } from '@repo/shared/server';
import { logger } from '@repo/shared/server';
import { HydratedDocument } from "mongoose";
import { signUpBase } from "@/utils/fieldsValidation/Auth/ZodAuthSchema";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";

const registerBodySchema = signUpBase
// Detect Mongo duplicate-key errors (E11000) raised by the unique indexes
function isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
export async function POST(request: NextRequest): Promise<NextResponse> {
    let ip = "unknown";
    try {
        const { allowed, remaining, retryAfterSec, ip: requestIp } = await checkIp(request, REGISTER_IP_KEY.namespace, REGISTER_IP_KEY.max, REGISTER_IP_KEY.windowSec); /// rate limit
        ip = requestIp
        if (!allowed) {
            logger.info(`Rate limit exceeded for IP: ${ip}`);
            return failResponse(
                `Too many requests. Try again in ${retryAfterSec} seconds.`,
                429, "RATE_LIMITED", { "Retry-After": String(retryAfterSec) },
            );
        };
        // await setCached(USER_VERIFIED_FLAG.namespace, email, "1", 15 * 60) ///use this flag while new user registration for reminder
        const body = await parseBody(request, registerBodySchema);
        if (!body.ok) {
            logger.error("Failed to parse request body.");
            return body.response;
        };
        const { name, email, username, password, profileImage } = body.data;
        await connectDB(process.env.MONGODB_URI!);

        //Check the verified flag First : cheap redis read
        const isEmailVerified = await getCached(USER_VERIFIED_FLAG.namespace, email);
        if (!isEmailVerified) {
            logger.info("Email is not verified");
            return failResponse("Email is not verified", 400, "EMAIL_NOT_VERIFIED");
        };
        const existing = await User.findOne({ $or: [{ email }, { username }] }).select('email username').lean().exec();
        if (existing) {
            const emailTaken = existing.email === email;
            logger.info(`Register conflict: ${emailTaken ? 'email' : 'username'} already taken`);
            return failResponse(`${emailTaken ? 'User already exists' : 'Username is already taken'}`, 400, `${emailTaken ? 'USER_ALREADY_EXISTS' : 'USERNAME_ALREADY_TAKEN'}`);
        };
        const hashedPassword: string = await bcrypt.hash(password, 10);
        const newUser: HydratedDocument<IUser> = new User({ name, email, password: hashedPassword, username: username, profileImage })
        await newUser.save();
        try {
            await invalidateCached(USER_VERIFIED_FLAG.namespace, email);

        } catch (cacheError: unknown) {
            logger.error("Failed to clear verified flag", { error: cacheError instanceof Error ? cacheError.message : String('Unknown error') });
        }
        let data = {
            user: {
                role: "student",
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                profileImage: newUser.profileImage,
            }
        }
        logger.info("User created successfully");
        return successResponse(data, 201, "User created successfully");
    } catch (error: unknown) {
        if (isDuplicateKeyError(error)) return failResponse("Email or username already taken ", 400, "USER_ALREADY_EXISTS"); ///To prevent combination of email and username to be unique
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error creating user:", { error: message });
        return failResponse("Failed to register user", 500, "SERVER_ERROR");
    }
}