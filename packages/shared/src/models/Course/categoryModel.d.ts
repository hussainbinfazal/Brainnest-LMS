import { ICategory } from '@/types/model';
import mongoose, { Model } from 'mongoose';
export declare const categorySchema: mongoose.Schema<ICategory, mongoose.Model<ICategory, any, any, any, any, any, ICategory>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
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
declare const Category: Model<ICategory>;
export default Category;
//# sourceMappingURL=categoryModel.d.ts.map