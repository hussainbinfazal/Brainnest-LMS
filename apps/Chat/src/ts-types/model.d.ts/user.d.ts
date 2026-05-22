import { Document, Types } from "mongoose";


export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  profileImage: string;
  role: 'student' | 'admin' | 'instructor';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}