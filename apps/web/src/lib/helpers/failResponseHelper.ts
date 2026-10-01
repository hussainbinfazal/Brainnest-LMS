import { NextResponse } from "next/server";

export function failResponse(error: unknown, status: number, message?: string, headers?: Record<string, string>, preserveShape = false) {
    if (preserveShape) return NextResponse.json(error, { status, headers });
    return NextResponse.json({ error, message }, { status, headers });
};

export function successResponse<T>(data: T, status: number, message?: string, headers?: Record<string, string>, preserveShape = false) { /// return success response data, message, status, headers
    if (preserveShape) return NextResponse.json(data, { status, headers });
    return NextResponse.json({ data, message }, { status, headers });
};

