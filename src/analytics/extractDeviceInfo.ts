import {Context} from "hono";
import {getConnInfo} from "hono/bun";

export interface DeviceInfo {
    device_id: string | null;
    device_os: string | null;
    user_agent: string | null;
    ip_address: string | null;
}

function sanitizeHeader(value: string | undefined, maxLength: number): string | null {
    if (!value) return null;
    return value.slice(0, maxLength).replace(/[\r\n\x00-\x1f]/g, "");
}

export function extractDeviceInfo(c: Context): DeviceInfo {
    const cfIp = c.req.header("cf-connecting-ip");
    const forwarded = c.req.header("x-forwarded-for");
    const rawIp = cfIp || forwarded || c.req.header("remote-addr") || getConnInfo(c).remote?.address || null;

    return {
        device_id: sanitizeHeader(c.req.header("x-device-id"), 128),
        device_os: sanitizeHeader(c.req.header("x-device-os"), 64),
        user_agent: sanitizeHeader(c.req.header("user-agent"), 256),
        ip_address: rawIp ? sanitizeHeader(rawIp, 128) : null,
    };
}
