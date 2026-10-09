import { NextRequest, NextResponse } from "next/server";
import { checkIp, connectDB, getCached, invalidateCached, IUser, logger, REGISTER_IP_KEY, User, USER_VERIFIED_FLAG } from '@repo/shared/server';
import { PENDING_AVATAR_SUBFOLDER } from "@repo/shared"

import bcrypt from "bcryptjs";

import { HydratedDocument } from "mongoose";
import { signUpBase } from "@/utils/fieldsValidation/Auth/ZodAuthSchema";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { z } from "zod";
import cloudinary from "@repo/shared/config/cloudinary/cloudinary";
import { uploadFolder } from "@/utils/upload/uploadSubFolderCreation";



const registerBodySchema = signUpBase.omit({ profileImage: true }).extend({
    finalUploadResult: z.object({ public_id: z.string().max(200) }).optional(),

});
const DEFAULT_AVATAR_URL = "/assets/default-avatar.svg";
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
        const { name, email, username, password, finalUploadResult } = body.data;

        // Verify and move Cloudinary upload if provided
        const avatarPublicId = finalUploadResult?.public_id;
        const finalUploadFolder = uploadFolder(`courses/${.toString()}`)
        const AVATAR_PENDING_PREFIX = `${uploadFolder(PENDING_AVATAR_SUBFOLDER)}/`; // ✅ No cloud name in public_id
        if (avatarPublicId) {

            try {
                // Verify the asset exists and check size
                const asset = await cloudinary.api.resource(avatarPublicId);

                if (asset.bytes > 2 * 1024 * 1024) {
                    return failResponse("Avatar too large (max 2MB)", 400, "AVATAR_TOO_LARGE");
                }

                // Verify it's in the pending folder
                if (!avatarPublicId.startsWith(AVATAR_PENDING_PREFIX)) {
                    logger.warn("Invalid public_id prefix", { avatarPublicId, email });
                    return failResponse("Invalid upload location", 400, "INVALID_UPLOAD_LOCATION");
                }
            } catch (cloudinaryError: unknown) {
                logger.error("Cloudinary verification failed", {
                    error: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
                    avatarPublicId
                });
                return failResponse("Invalid avatar upload", 400, "INVALID_AVATAR");
            }
        }
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
        const newUser: HydratedDocument<IUser> = new User({
            name,
            email,
            password: hashedPassword,
            username,
            profileImage: DEFAULT_AVATAR_URL,
        });
        await newUser.save();
        if (avatarPublicId) {
            try {
                // Move out of the pending folder, the new user id makes the target unique
                const moved = await cloudinary.uploader.rename(avatarPublicId, `${AVATAR_PENDING_PREFIX}/${newUser._id}`);
                // Remove the tag so the 24h cleanup job keeps this file
                await cloudinary.uploader.remove_tag(AVATAR_PENDING_PREFIX, [moved.public_id]);
                // Use Cloudinary's answer, never client data
                newUser.profileImage = moved.secure_url;
                // Persist the permanent URL
                await newUser.save();
            } catch (moveError: unknown) {
                // Registration still succeeds, the user keeps the default avatar
                logger.error("Failed to claim avatar", { error: moveError instanceof Error ? moveError.message : "Unknown error", userId: newUser._id.toString() });
            }
        }
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