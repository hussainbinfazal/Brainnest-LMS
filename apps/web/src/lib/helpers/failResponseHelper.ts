import { NextResponse } from "next/server";

export function failResponse(error: string, status: number, code?: string, headers?: Record<string, string>) {
    return NextResponse.json({ error, code }, { status, headers });
};

export function successResponse(data: any, message: string, status: number, headers?: Record<string, string>) { /// return success response data, message, status, headers
    return NextResponse.json(data, { status, headers });
};



