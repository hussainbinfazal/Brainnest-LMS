import { NextRequest, NextResponse } from "next/server";
import { checkIp, getCached, invalidateCached, REGISTER_IP_KEY, User, USER_VERIFIED_FLAG, validateEmail } from '@repo/shared/server';
import { connectDB } from '@repo/shared/server';
import bcrypt from "bcryptjs";
import { IUser } from '@repo/shared/server';
import { logger } from '@repo/shared/server';
import { HydratedDocument } from "mongoose";
import { signUpBase } from "@/utils/fieldsValidation/Auth/ZodAuthSchema";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import z from "zod";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";

const registerBodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email("Invalid email").refine(validateEmail),
    username: z.string().min(5, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profileImage: z.string(),
}).strict();
export async function POST(request: NextRequest): Promise<NextResponse> {
    let ip = "unknown";
    let userEmail = null
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
        const [dbUser, isEmailVerified] = await Promise.all([
            User.exists({ email }).exec(),
            getCached(USER_VERIFIED_FLAG.namespace, email)
        ])
        if (dbUser) {
            logger.info("User already exists");
            return failResponse("User already exists", 400, "USER_ALREADY_EXISTS");
        };
        if (!isEmailVerified) {
            logger.info("Email is not verified");
            return failResponse("Email is not verified", 400, "EMAIL_NOT_VERIFIED");
        };
        userEmail = email;
        const hashedPassword: string = await bcrypt.hash(password, 10);
        const newUser: HydratedDocument<IUser> = new User({ name, email, password: hashedPassword, username: username, profileImage })
        await newUser.save();
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
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error creating user:", { error: message });
        return failResponse("Failed to register user", 500, "SERVER_ERROR");
    } finally {
        if (userEmail) { invalidateCached(USER_VERIFIED_FLAG.namespace, email) }
    }
}