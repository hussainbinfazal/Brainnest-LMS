import { isIP } from 'node:net';


// Set via env, depending on where you deploy (see table below)
const IP_HEADER = process.env.CLIENT_IP_HEADER;              // e.g. "cf-connecting-ip"
const TRUSTED_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);

export type RequestHeaders = Headers | Record<string, string | string[] | undefined>;

function getHeader(headers: RequestHeaders, name: string): string | undefined {
    if (headers instanceof Headers) {
        return headers.get(name) ?? undefined;
    }

    const value = headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

export function getClientIp(headers: RequestHeaders): string {
    if (IP_HEADER) {
        const value = getHeader(headers, IP_HEADER)?.trim();
        if (value && isIP(value)) return value;
    } else {
        const parts = getHeader(headers, 'x-forwarded-for')?.split(',').map((s) => s.trim());
        const candidate = parts?.[parts.length - TRUSTED_HOPS];
        if (candidate && isIP(candidate)) return candidate;
    }
    return 'unknown';
}