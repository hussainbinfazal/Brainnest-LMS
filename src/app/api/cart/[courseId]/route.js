import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import Cart from "@/models/cartModel";

export async function POST(request, context) {
    await connectDB();
    try {
        const user = await getDataFromToken(request);
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 403 });
        const { courseId } = await context.params;
        if (!courseId) return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        const course = await Course.findById(courseId);;
        if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
        let cart = await Cart.findOne({ user: user._id || user.id });
        if (!cart) {
            const coursePrice = course.price;
            const courseDiscount = course.discount || 0;

            const subtotal = coursePrice;
            const discountAmount = parseFloat(((courseDiscount / 100) * subtotal).toFixed(2));
            const tax = parseFloat(((subtotal - discountAmount) * 0.1).toFixed(2));
            const total = parseFloat((subtotal - discountAmount + tax).toFixed(2));

            const newCart = new Cart({
                user: user._id || user.id,
                courses: [course._id],
                subtotal,
                discount: discountAmount,
                tax,
                total
            });


            await newCart.save();


            await newCart.populate("courses", "instructor name");


        } else {
            const isCourseExist = cart.courses.find((item) => item._id.toString() === course._id.toString());
            if (isCourseExist) return NextResponse.json({ message: "Course already exists in cart" }, { status: 400 });
            cart.courses.push(course._id);
            await cart.save();

        }

        return NextResponse.json({ message: "Course added to cart successfully", course }, { status: 200 });
    } catch (error) {
        consoe.log(error);
        console.log("There is a error on the server side", error);
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }

};

export async function DELETE(request, context) {
    await connectDB();
    try {
        const user = await getDataFromToken(request);
        let userId = user._id || user.id;
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 403 });
        const { courseId } = await context.params;
        if (!courseId) return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        const course = await Course.findById(courseId);
        if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return NextResponse.json({ message: "Cart not found" }, { status: 404 });
        const isCourseExist = cart.courses.some((item) => item._id.toString() === course._id.toString());
        if (!isCourseExist) return NextResponse.json({ message: "Course not found in cart" }, { status: 400 });
        cart.courses.pull(course._id);
        await cart.save();
        return NextResponse.json({ message: "Course removed from cart successfully", course }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }
}