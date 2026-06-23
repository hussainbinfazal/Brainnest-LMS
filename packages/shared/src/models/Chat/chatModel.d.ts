import { IChat } from '@repo/shared';
import mongoose, { Schema, Model } from 'mongoose';
export declare const paymentsSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    paymentId?: mongoose.Types.ObjectId | null | undefined;
    amount?: number | null | undefined;
    paymentAt?: NativeDate | null | undefined;
    paymentBy?: mongoose.Types.ObjectId | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    paymentId?: mongoose.Types.ObjectId | null | undefined;
    amount?: number | null | undefined;
    paymentAt?: NativeDate | null | undefined;
    paymentBy?: mongoose.Types.ObjectId | null | undefined;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    paymentId?: mongoose.Types.ObjectId | null | undefined;
    amount?: number | null | undefined;
    paymentAt?: NativeDate | null | undefined;
    paymentBy?: mongoose.Types.ObjectId | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    paymentId?: mongoose.Types.ObjectId | null | undefined;
    amount?: number | null | undefined;
    paymentAt?: NativeDate | null | undefined;
    paymentBy?: mongoose.Types.ObjectId | null | undefined;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export declare const chatSchema: Schema<IChat>;
declare const Chat: Model<IChat>;
export default Chat;
//# sourceMappingURL=chatModel.d.ts.map