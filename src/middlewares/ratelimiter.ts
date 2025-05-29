import {getConnInfo} from "hono/bun";
import {Context} from "hono";

export const ratelimiterKeyGenerator = (c: Context) => {
    const cfConnectingIp = c.req.header('cf-connecting-ip');
    const xForwardedFor = c.req.header('x-forwarded-for');
    const remoteIp = cfConnectingIp || xForwardedFor || c.req.header('remote-addr') ||
        getConnInfo(c).remote.address;

    const authHeader = c.req.header("authorization");
    let user = '';
    if (authHeader && authHeader.startsWith('Basic ')) {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        user = credentials.split(':')[0]; // Extract the username
    }

    if (user) {
        return user;
    }

    return remoteIp ?? "unknown";
}
