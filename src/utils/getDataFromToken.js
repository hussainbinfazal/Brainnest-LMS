import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export const getDataFromToken = async (request) => {
    try {
        const token = request.cookies.get("token") || "";
        // console.log("received Token in the getDataFromToken from cookies", token)
        const secret = process.env.JWT_SECRET;
        if (!token || !token.value) {
            // console.log("No token found in cookies");
            return null;
        }

        const decodedToken = jwt.verify(token.value, secret);
        if (!decodedToken) {
            // console.log("Created token is not valid");
            return null;
        }
        // console.log("received Token in the getDataFromToken", decodedToken)
        return decodedToken;
    } catch (error) {
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 })
    }

}