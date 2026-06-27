import { NextRequest, NextResponse } from "next/server";
import { CartDocument, connectDB, logger, validateMongooseId } from "@repo/shared";
import { Course, Cart, ISessionUser, ICart, ICourse } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";

export async function POST(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const sessionUser: ISessionUser | null = await getDataFromToken(request);
        if (!sessionUser) return NextResponse.json({ message: "User not found" }, { status: 403 });
        const { courseId } = await context.params;
        if (validateMongooseId({ courseId: courseId }) ||
            validateMongooseId({ userId: sessionUser.id })) return NextResponse.json({ message: "Course id and user id should be valid" }, { status: 400 });

        if (!courseId || !validateMongooseId({ courseId })) return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        const [courseDB, cartDB] = await Promise.all([
            Course.findById(courseId).select("title price discount").lean(),
            Cart.findOne({ user: sessionUser.id }).lean()
        ])
        if (!courseDB) return NextResponse.json({ message: "Course not found" }, { status: 404 });
        if (!cartDB) return NextResponse.json({ message: "Cart not found" }, { status: 404 });
        let cart: CartDocument | null = await Cart.findOne({ user: sessionUser.id });
        if (!cart) {
            const coursePrice: number = courseDB.price;
            const courseDiscount: number = courseDB.discount || 0;

            const subtotal: number = coursePrice;
            const discountAmount: number = parseFloat(((courseDiscount / 100) * subtotal).toFixed(2));
            const tax: number = parseFloat(((subtotal - discountAmount) * 0.1).toFixed(2));
            const total: number = parseFloat((subtotal - discountAmount + tax).toFixed(2));

            const newCart: CartDocument | null = new Cart({
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
            if (isCourseExist) return NextResponse.json({ message: "Course already exists in cart" }, { status: 400 });

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

        return NextResponse.json({ message: "Course added to cart successfully", courseDB }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in adding course to cart", { error: message });
        return NextResponse.json({ message: `Error in adding course to cart` }, { status: 500 });
    }

};

export async function DELETE(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        const userId: string | null = user?.id || "";
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 403 });
        const isUserIdValid = validateMongooseId({ userId });
        if (!isUserIdValid) return NextResponse.json({ message: "User id should be valid" }, { status: 400 });
        const { courseId } = await context.params;

        if (!courseId || !validateMongooseId({ courseId })) return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        const course: ICourse | null = await Course.findById(courseId);
        if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
        const cart: CartDocument | null = await Cart.findOne({ user: userId });
        if (!cart) return NextResponse.json({ message: "Cart not found" }, { status: 404 });
        const isCourseExist: boolean = cart.courses.some((item) => item._id.toString() === course._id.toString());
        if (!isCourseExist) return NextResponse.json({ message: "Course not found in cart" }, { status: 400 });
        cart.courses.filter((item) => item._id.toString() !== course._id.toString());
        // cart.courses.pull(course._id);
        await cart.save();
        return NextResponse.json({ message: "Course removed from cart successfully", course }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Deleting Course from cart", { error: message });
        return NextResponse.json({ message: `Error in Deleting Course` }, { status: 500 });
    }
}