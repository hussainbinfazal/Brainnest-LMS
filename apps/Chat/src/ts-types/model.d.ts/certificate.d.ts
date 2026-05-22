import { Document, Types } from "mongoose";

export interface ICertificate extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  courseName: string;
  instructorName: string;
  completionDate: Date;
  certificatePreview: string;
  pdfUrl: string;
  generatedAt: Date;
  verificationCode: string;
  isRevoked: boolean;


}