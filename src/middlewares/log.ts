import { MiddlewareHandler } from 'hono';
import {getConnInfo} from "hono/bun";

export const requestLogger: MiddlewareHandler = async (c, next) => {
    const start = Date.now();

    const cfConnectingIp = c.req.header('cf-connecting-ip');
    const xForwardedFor = c.req.header('x-forwarded-for');
    const remoteIp = cfConnectingIp || xForwardedFor || c.req.header('remote-addr') || getConnInfo(c).remote.address || 'Unknown IP';

    const userAgent = c.req.header('user-agent') || 'Unknown User-Agent';
    const referer = c.req.header('referer') || 'No Referer';

    const authHeader = c.req.header("authorization");
    let user = 'Unknown User';
    if (authHeader && authHeader.startsWith('Basic ')) {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        user = credentials.split(':')[0]; // Extract the username
    }

    await next();

    const ms = Date.now() - start;
    console.log(`💳 Request: [${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${ms}ms (${c.res.status}) from ${remoteIp}, User-Agent: ${userAgent}, Referer: ${referer}, User: ${user}`);
};
