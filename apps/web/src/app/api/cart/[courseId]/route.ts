import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { NextRequest, NextResponse } from "next/server";
import { CartDocument, connectDB, logger, validateMongooseId } from '@repo/shared/server';
import { Course, Cart, ISessionUser, ICart, ICourse } from '@repo/shared/server';
import { Session } from "next-auth";
import { auth } from "@/auth";
import { CustomNextRequest } from "@/types/server";

export async function POST(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const sessionUser: ISessionUser | null = authSession?.user;

        if (!sessionUser) return failResponse({ message: "User not found" }, 403, undefined, undefined, true);
        const { courseId } = await context.params;
        if (validateMongooseId({ courseId: courseId }) ||
            validateMongooseId({ userId: sessionUser.id })) return failResponse({ message: "Course id and user id should be valid" }, 400, undefined, undefined, true);

        if (!courseId || !validateMongooseId({ courseId })) return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
        await connectDB(process.env.MONGODB_URI!);
        const [courseDB, cartDB] = await Promise.all([
            Course.findById(courseId).select("title price discount").lean(),
            Cart.findOne({ user: sessionUser.id }).lean()
        ])
        if (!courseDB) return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        if (!cartDB) return failResponse({ message: "Cart not found" }, 404, undefined, undefined, true);
        let cart: CartDocument | null = await Cart.findOne({ user: sessionUser.id });
        if (!cart) {
            const coursePrice: number = courseDB.price;
            const courseDiscount: number = courseDB.discount || 0;

            const subtotal: number = coursePrice;
            const discountAmount: number = parseFloat(((courseDiscount / 100) * subtotal).toFixed(2));
            const tax: number = parseFloat(((subtotal - discountAmount) * 0.1).toFixed(2));
            const total: number = parseFloat((subtotal - discountAmount + tax).toFixed(2));

            const newCart: CartDocument = new Cart({
                user: sessionUser.id,
                courses: [courseDB._id],
                subTotal: subtotal,
                discount: discountAmount,
                tax,
                total
            });


            await newCart.save();


            await newCart.populate("courses", "instructor name");


        } else {
            const isCourseExist = cart.courses.find((item) => item._id.toString() === courseDB._id.toString())
            if (isCourseExist) return failResponse({ message: "Course already exists in cart" }, 400, undefined, undefined, true);

            cart.courses.push(courseDB._id);

            // Recalculate totals
            await cart.populate<{ courses: ICourse[] }>('courses');
            const populatedCourses: ICourse[] = cart.courses as ICourse[];

            const totalCoursePrice: number = populatedCourses.reduce((sum, course) => sum + course.price, 0);
            const totalDiscount: number = populatedCourses.reduce((sum, course) => sum + (course.discount || 0), 0);

            cart.subTotal = totalCoursePrice;
            const discountAmount = parseFloat(((totalDiscount / 100) * cart.subTotal).toFixed(2));
            cart.discount = discountAmount;
            cart.tax = parseFloat(((cart.subTotal - discountAmount) * 0.1).toFixed(2));
            cart.total = parseFloat((cart.subTotal - discountAmount + cart.tax).toFixed(2));

            await cart.save();
        }

        return successResponse({ message: "Course added to cart successfully", courseDB }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in adding course to cart", { error: message });
        return failResponse({ message: `Error in adding course to cart` }, 500, undefined, undefined, true);
    }

};

export async function DELETE(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    await connectDB();
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        const userId: string | null = user?.id || "";
        if (!user) return failResponse({ message: "User not found" }, 403, undefined, undefined, true);
        const isUserIdValid = validateMongooseId({ userId });
        if (!isUserIdValid) return failResponse({ message: "User id should be valid" }, 400, undefined, undefined, true);
        const { courseId } = await context.params;

        if (!courseId || !validateMongooseId({ courseId })) return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
        const course: ICourse | null = await Course.findById(courseId);
        if (!course) return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        const cart: CartDocument | null = await Cart.findOne({ user: userId });
        if (!cart) return failResponse({ message: "Cart not found" }, 404, undefined, undefined, true);
        const isCourseExist: boolean = cart.courses.some((item) => item._id.toString() === course._id.toString());
        if (!isCourseExist) return failResponse({ message: "Course not found in cart" }, 400, undefined, undefined, true);
        cart.courses.filter((item) => item._id.toString() !== course._id.toString());
        // cart.courses.pull(course._id);
        await cart.save();
        logger.info("Course removed from cart successfully");
        return successResponse({ message: "Course removed from cart successfully", course }, 200, undefined, undefined, true);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Deleting Course from cart", { error: message });
        return failResponse({ message: `Error in Deleting Course` }, 500, undefined, undefined, true);
    }
}