import { IOrder } from '@repo/shared';
import mongoose, { Model, Types } from 'mongoose';
export declare const orderSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "pending" | "completed" | "failed" | "cancelled";
    user: Types.ObjectId;
    isPaid: boolean;
    paymentMethod: string;
    orderItems: Types.DocumentArray<{
        course: Types.ObjectId;
    }, Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        course: Types.ObjectId;
    }, {}, {}> & {
        course: Types.ObjectId;
    }>;
    razorpayOrderId: string;
    totalPrice: number;
    paidAt?: NativeDate | null | undefined;
    paymentResult?: {
        id?: string | null | undefined;
        status?: string | null | undefined;
        update_time?: string | null | undefined;
        email_address?: string | null | undefined;
        failure_reason?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    status: "pending" | "completed" | "failed" | "cancelled";
    user: Types.ObjectId;
    isPaid: boolean;
    paymentMethod: string;
    orderItems: Types.DocumentArray<{
        course: Types.ObjectId;
    }, Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        course: Types.ObjectId;
    }, {}, {}> & {
        course: Types.ObjectId;
    }>;
    razorpayOrderId: string;
    totalPrice: number;
    paidAt?: NativeDate | null | undefined;
    paymentResult?: {
        id?: string | null | undefined;
        status?: string | null | undefined;
        update_time?: string | null | undefined;
        email_address?: string | null | undefined;
        failure_reason?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    status: "pending" | "completed" | "failed" | "cancelled";
    user: Types.ObjectId;
    isPaid: boolean;
    paymentMethod: string;
    orderItems: Types.DocumentArray<{
        course: Types.ObjectId;
    }, Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        course: Types.ObjectId;
    }, {}, {}> & {
        course: Types.ObjectId;
    }>;
    razorpayOrderId: string;
    totalPrice: number;
    paidAt?: NativeDate | null | undefined;
    paymentResult?: {
        id?: string | null | undefined;
        status?: string | null | undefined;
        update_time?: string | null | undefined;
        email_address?: string | null | undefined;
        failure_reason?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    status: "pending" | "completed" | "failed" | "cancelled";
    user: Types.ObjectId;
    isPaid: boolean;
    paymentMethod: string;
    orderItems: Types.DocumentArray<{
        course: Types.ObjectId;
    }, Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        course: Types.ObjectId;
    }, {}, {}> & {
        course: Types.ObjectId;
    }>;
    razorpayOrderId: string;
    totalPrice: number;
    paidAt?: NativeDate | null | undefined;
    paymentResult?: {
        id?: string | null | undefined;
        status?: string | null | undefined;
        update_time?: string | null | undefined;
        email_address?: string | null | undefined;
        failure_reason?: string | null | undefined;
    } | null | undefined;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
declare const Order: Model<IOrder>;
export default Order;
//# sourceMappingURL=orderModel.d.ts.map