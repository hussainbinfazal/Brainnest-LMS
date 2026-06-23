import { ICertificate } from '@/types/model';
import mongoose, { Model } from 'mongoose';
export declare const certificateSchema: mongoose.Schema<ICertificate, mongoose.Model<ICertificate, any, any, any, any, any, ICertificate>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    [x: number]: unknown;
    [x: symbol]: unknown;
    [x: string]: unknown;
}, mongoose.Document<unknown, {}, {
    [x: number]: unknown;
    [x: symbol]: unknown;
    [x: string]: unknown;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    [x: number]: unknown;
    [x: symbol]: unknown;
    [x: string]: unknown;
} & Required<{
    _id: unknown;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, any, {
    [x: number]: {};
    [x: symbol]: {};
    [x: string]: {};
} & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
declare const Certificate: Model<ICertificate>;
export default Certificate;
//# sourceMappingURL=certificateModel.d.ts.map