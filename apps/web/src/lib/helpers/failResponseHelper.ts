import { NextResponse } from "next/server";

export const failResponse = (error: string, status: number, code?: string, headers?: Record<string, string>) =>
    NextResponse.json({ error, code }, { status, headers });