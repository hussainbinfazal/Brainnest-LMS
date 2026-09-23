import { isIP } from 'node:net';


// Set via env, depending on where you deploy (see table below)
const IP_HEADER = process.env.CLIENT_IP_HEADER;              // e.g. "cf-connecting-ip"
const TRUSTED_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);


export function getClientIp(headers: Headers): string {
    if (IP_HEADER) {
        const value = headers.get(IP_HEADER)?.trim();
        if (value && isIP(value)) return value;
    } else {
        const parts = headers.get('x-forwarded-for')?.split(',').map((s) => s.trim());
        const candidate = parts?.[parts.length - TRUSTED_HOPS];
        if (candidate && isIP(candidate)) return candidate;
    }
    return 'unknown';
}