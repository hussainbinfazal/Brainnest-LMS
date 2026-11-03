// Import mongoose pieces to define the model
import { Schema, model, models, Types, Model } from "mongoose";

// Shape of one transcript record
type ILessonTranscript = {
    // Pending Cloudinary public_id: the only id that exists at upload time
    publicId: string;
    // Who uploaded it, so other users cannot read the transcript
    userId: Types.ObjectId;
    // Filled in later, when the instructor saves and the lesson gets created
    lessonId?: Types.ObjectId;
    // Filled in later, same moment as lessonId
    courseId?: Types.ObjectId;
    // The audio URL that was transcribed
    sourceUrl: string;
    // Full text, empty until the worker finishes
    text: string;
    // Timed segments for RAG chunks and timestamped FAQs
    segments: { start: number; end: number; text: string }[];
    // Progress of the whole pipeline
    status: "processing" | "ready" | "failed";
    // AI suggestion waiting for the instructor to accept or edit
    draft?: { description: string; faqs: { question: string; answer: string }[] };
    // Auto-delete date for abandoned uploads, removed once the lesson is saved
    expiresAt?: Date;
};

// Schema for the transcript collection
const LessonTranscriptSchema = new Schema<ILessonTranscript>(
    {
        // The pending public_id is the unique key of this record
        publicId: { type: String, required: true, unique: true },
        // Owner of the upload, indexed because the status route filters by it
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        // Optional until the lesson exists
        lessonId: { type: Schema.Types.ObjectId, ref: "Lesson" },
        // Optional until the course exists
        courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
        // Audio URL used for transcription
        sourceUrl: { type: String, required: true },
        // Default to empty so the record can exist before the worker finishes
        text: { type: String, default: "" },
        // Default to an empty list
        segments: { type: [{ _id: false, start: Number, end: Number, text: String }], default: [] },
        // Start as processing, because the record is created when the job is queued
        status: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
        // Nested draft object, plain fields without extra ids
        draft: {
            source: String,
            // Suggested lesson description
            description: String,
            // Suggested FAQ pairs
            faqs: { type: [{ _id: false, question: String, answer: String }], default: undefined },
        },
        // Expiry date used by the TTL index below
        expiresAt: { type: Date },
    },
    // Add createdAt and updatedAt automatically
    { timestamps: true }
);

// Unique only when lessonId exists, so many unlinked records do not collide on "null"
LessonTranscriptSchema.index(
    // Index on lessonId
    { lessonId: 1 },
    // Apply the uniqueness rule only to documents that have a lessonId
    { unique: true, partialFilterExpression: { lessonId: { $type: "objectId" } } }
);
// Delete the document when expiresAt passes; documents without expiresAt are never deleted
LessonTranscriptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Reuse the model if hot reload already registered it
export const LessonTranscript: Model<ILessonTranscript> =
    // Existing model or a new one
    models.LessonTranscript || model<ILessonTranscript>("LessonTranscript", LessonTranscriptSchema);