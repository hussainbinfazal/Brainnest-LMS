import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/mongoDB/db";
import Course from "@/models/Course/courseModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Cart from "@/models/Cart/cartModel";
import { ISessionUser } from "@/types/server";
import { ICart, ICourse } from "@/types/model";

export async function POST(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const sessionUser: ISessionUser | null = await getDataFromToken(request);
        if (!sessionUser) return NextResponse.json({ message: "User not found" }, { status: 403 });
        const { courseId } = await context.params;
        if (!courseId) return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        const course: ICourse | null = await Course.findById(courseId);;
        if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
        let cart: ICart | null = await Cart.findOne({ user: sessionUser.id });
        if (!cart) {
            const coursePrice: number = course.price;
            const courseDiscount: number = course.discount || 0;

            const subtotal: number = coursePrice;
            const discountAmount: number = parseFloat(((courseDiscount / 100) * subtotal).toFixed(2));
            const tax: number = parseFloat(((subtotal - discountAmount) * 0.1).toFixed(2));
            const total: number = parseFloat((subtotal - discountAmount + tax).toFixed(2));

            const newCart: ICart | null = new Cart({
                user: sessionUser.id,
                courses: [course._id],
                subTotal: subtotal,
                discount: discountAmount,
                tax,
                total
            });


            await newCart.save();


            await newCart.populate("courses", "instructor name");


        } else {
            const isCourseExist = cart.courses.find((item) => item._id.toString() === course._id.toString())
            if (isCourseExist) return NextResponse.json({ message: "Course already exists in cart" }, { status: 400 });

            cart.courses.push(course._id);

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

        return NextResponse.json({ message: "Course added to cart successfully", course }, { status: 200 });
    } catch (error: any) {
        console.log(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Error in adding course to cart: ${message}` }, { status: 500 });
    }

};

export async function DELETE(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        const userId: string | null = user?.id || "";
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 403 });
        const { courseId } = await context.params;
        if (!courseId) return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        const course: ICourse | null = await Course.findById(courseId);
        if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
        const cart: ICart | null = await Cart.findOne({ user: userId });
        if (!cart) return NextResponse.json({ message: "Cart not found" }, { status: 404 });
        const isCourseExist: boolean = cart.courses.some((item) => item._id.toString() === course._id.toString());
        if (!isCourseExist) return NextResponse.json({ message: "Course not found in cart" }, { status: 400 });
        cart.courses.filter((item) => item._id.toString() !== course._id.toString());
        // cart.courses.pull(course._id);
        await cart.save();
        return NextResponse.json({ message: "Course removed from cart successfully", course }, { status: 200 });

    } catch (error: any) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Error in Deleting Course: ${message}` }, { status: 500 });
    }
}