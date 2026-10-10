import { NextRequest, NextResponse } from "next/server";
import { checkIp, connectDB, getCached, invalidateCached, IUser, logger, REGISTER_IP_KEY, User, USER_VERIFIED_FLAG } from '@repo/shared/server';
import { MAX_FILE_SIZE, PENDING_AVATAR_SUBFOLDER } from "@repo/shared"

import bcrypt from "bcryptjs";

import { HydratedDocument, Types } from "mongoose";
import { signUpBase } from "@/utils/fieldsValidation/Auth/ZodAuthSchema";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { z } from "zod";
import cloudinary from "@repo/shared/config/cloudinary/cloudinary";
import { uploadFolder } from "@/utils/upload/uploadSubFolderCreation";
import { AssetError, AssetErrorCode, AVATAR_ERRORS, moveAssets, MovedAsset, PendingAsset, rollbackMoves, verifyAssets } from "@/utils/CloudinaryAssets";



const registerBodySchema = signUpBase.omit({ profileImage: true }).extend({
    finalUploadResult: z.object({ public_id: z.string().max(200) }).optional(),

});
const DEFAULT_AVATAR_URL = "/assets/default-avatar.svg";


function isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
export async function POST(request: NextRequest): Promise<NextResponse> {
    let ip = "unknown";
    let movedAvatar: MovedAsset | undefined;

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

        await connectDB(process.env.MONGODB_URI!);
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
        const userId = new Types.ObjectId();
        // Verify and move Cloudinary upload if provided
        // // Public id of the pending upload, if any
        const avatarPublicId = finalUploadResult?.public_id;
        let profileImage = DEFAULT_AVATAR_URL;


        ///Verify and move the avatar (only reached  by users  who passed every cheap check)
        if (avatarPublicId) {
            //Describe the file for the explorer
            const avatarAsset: PendingAsset = {
                ///Where the client say the file is
                publicId: avatarPublicId,
                ///Avatars are image
                kind: 'image',
                ///The only folder an avatar may come from
                pendingPrefix: uploadFolder(PENDING_AVATAR_SUBFOLDER),
                ///Final home: one folder per user, NOT the pending folder;
                targetPublicId: uploadFolder(`avatars/${userId.toString()}`),
                maxBytes: MAX_FILE_SIZE.avatar,

            }

            ///Verify the Asset
            try {
                await verifyAssets([avatarAsset])
            } catch (verifyError: unknown) {
                if (!(verifyError instanceof AssetError))
                    throw verifyError

                logger.warn('Avatar verification failed', { code: verifyError.code, avatarPublicId, email })


                ///Translate the helper code to match your existing client contract
                const mapped = AVATAR_ERRORS[verifyError.code]
                if (mapped) {
                    return failResponse(mapped.message, verifyError?.status, mapped.code, undefined, true);
                }
            }
            ////Move it, a failure here must not block registration
            try {
                ///The helper renames, removes the pending tag, and rollsback itself
                const moved = await moveAssets([avatarAsset]);

                movedAvatar = moved.get(avatarPublicId);


                //Cloudinary answer's 
                profileImage = movedAvatar!.url

            } catch (moveError: unknown) {
                logger.error("Failed to claim Avatar", { error: moveError instanceof Error ? moveError.message : "Unknown error", email })
            }
        }

        //Check the verified flag First : cheap redis read
        const hashedPassword: string = await bcrypt.hash(password, 10);
        const newUser: HydratedDocument<IUser> = new User({
            name,
            email,
            password: hashedPassword,
            username,
            profileImage: DEFAULT_AVATAR_URL,
        });
        await newUser.save();
        movedAvatar = undefined;

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
        ///////Rollback if some thing failed
        if (movedAvatar) await rollbackMoves([movedAvatar])
        if (isDuplicateKeyError(error)) return failResponse("Email or username already taken ", 400, "USER_ALREADY_EXISTS"); ///To prevent combination of email and username to be unique
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error creating user:", { error: message });
        return failResponse("Failed to register user", 500, "SERVER_ERROR");
    }
}