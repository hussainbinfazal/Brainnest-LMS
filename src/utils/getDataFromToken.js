import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export const getDataFromToken = async (request) => {
    try {
        const session = await auth();
        console.log("This is the Session in the getToken:", session?.user);
       return session.user;
    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }

}