import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { logger } from "../../../../../packages/shared/src/logger/logger";

type UploadResourceType = "image" | "video" | "raw" | "auto";

export async function uploadWithServer(
   buffer: Buffer,
   fileName: string,
   resourceType: UploadResourceType = "raw"
): Promise<string> {

   return new Promise((resolve, reject) => {

      const publicId = `${Date.now()}-${fileName}`;

      const uploadStream = cloudinary.uploader.upload_stream(
         {
            resource_type: resourceType,
            public_id: publicId,
            folder: process.env.CLOUDINARY_UPLOAD_FOLDER
         },
         (error, result) => {

            if (error) {
               logger.error("Cloudinary upload failed", {
                  error: error.message
               });

               return reject(error);
            }

            if (!result) {
               return reject(
                  new Error("Cloudinary upload returned no result.")
               );
            }

            logger.info("Cloudinary upload successful", {
               publicId: result.public_id,
               url: result.secure_url
            });

            resolve(result.secure_url);
         }
      );

      streamifier
         .createReadStream(buffer)
         .on("error", (streamError) => {

            logger.error("Buffer stream error", {
               error: streamError.message
            });

            reject(streamError);
         })
         .pipe(uploadStream);
   });
}