import { Model, model, models, Schema } from "mongoose";
import { CourseTranscriptStatus } from "./Enums";

type TranscriptSegment = {
    start: number;
    end: number;
    text: string;
};

type LessonTranscriptEntry = {
    lessonId: string;
    lessonTranscript: string;
    lessonTitle: string;
    lessonDescription: string;
    lessonPreviewTranscript: string;
    lessonSegemnts: TranscriptSegment[];
    lessonPreviewSegments: TranscriptSegment[];
};

type ICourseTranscript = {
    courseId: string;
    courseTitle: string;
    courseDescription: string;
    previewTranscript: string;
    coursePreviewTranscript: string;
    lessonsTranscript: LessonTranscriptEntry[];
    previewSegments: TranscriptSegment[];
    status: CourseTranscriptStatus;
};

const CourseTranscriptSchema = new Schema<ICourseTranscript>(
    {
        courseId: {
            type: String,
            required: true,
        },
        courseTitle: {
            type: String,
            required: true,
        },
        courseDescription: {
            type: String,
            required: true,
        },
        previewTranscript: {
            type: String,
            required: true,
        },
        coursePreviewTranscript: {
            type: String,
            required: true,
        },
        lessonsTranscript: [
            {
                lessonId: {
                    type: String,
                    required: true,
                },
                lessonTitle: {
                    type: String,
                    required: true,
                },
                lessonDescripton:{
                    type: String,
                    required: true,
                },
                lessonTranscript: {
                    type: String,
                    required: true,
                },
                lessonPreviewTranscript: {
                    type: String,
                    required: true,
                },
                lessonSegemnts: [
                    {
                        start: { type: Number, required: true },
                        end: { type: Number, required: true },
                        text: { type: String, required: true },
                    },
                ],
                lessonPreviewSegments: [
                    {
                        start: { type: Number, required: true },
                        end: { type: Number, required: true },
                        text: { type: String, required: true },
                    },
                ],
            },
        ],
        previewSegments: [
            {
                start: { type: Number, required: true },
                end: { type: Number, required: true },
                text: { type: String, required: true },
            },
        ],
        status: {
            type: String,
            enum: Object.values(CourseTranscriptStatus),
            default: CourseTranscriptStatus.Processing,
            required: true,
        },
    },
    { timestamps: true },
);

CourseTranscriptSchema.index(
    { courseId: 1 },
    {
        unique: true,
        partialFilterExpression: { lessonId: { $type: "objectId" } },
    },
);

export const CourseTranscript: Model<ICourseTranscript> =
    models.CourseTranscript ||
    model<ICourseTranscript>("CourseTranscript", CourseTranscriptSchema);
