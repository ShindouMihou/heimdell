import { Hono } from 'hono'
import config from "./config";
import * as fs from "node:fs";
import {db} from "./db/db";
import {AppContextEnv} from "./types/hono";
import {apiV1} from "./routes/api/v1";
import {requestLogger} from "./middlewares/log";
import * as path from "node:path";
import {serveStatic} from "hono/bun";
import {rateLimiter} from "hono-rate-limiter";
import {ratelimiterKeyGenerator} from "./middlewares/ratelimiter";

console.debug("🔰 Heimdell: The Open-Source React Native Over-The-Air (OTA) Server");
console.debug("🔰 Heimdell: Using configuration", JSON.stringify({
    storagePath: config.storagePath,
    databasePath: config.databasePath,
    users: Object.entries(config.users).map(([username, password]) => {
        return {
            username,
            password: password ? "******" : ""
        }
    }),
    tags: config.tags
}, null, 2));

console.debug("🔰 Heimdell: Preparing the filesystem service...");
try {
    fs.mkdirSync(config.storagePath, { recursive: true });
} catch (e) {}
try {
    fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
} catch (e) {}
db.run(`PRAGMA journal_mode = WAL;`);


console.debug("🔰 Heimdell: Hosting static bundle files in", path.join(config.storagePath, "bundles"));
const app = new Hono<AppContextEnv>();
app.use("*", requestLogger);
app.use(
    "*",
    rateLimiter({
        windowMs: 60 * 1000,
        limit: 25,
        keyGenerator: ratelimiterKeyGenerator
    })
)
app.use(
    "/bundles/*",
    rateLimiter({
        windowMs: 60 * 1000,
        limit: 10,
        keyGenerator: ratelimiterKeyGenerator
    }),
    serveStatic({
        root: path.join(config.storagePath, "bundles"),
        rewriteRequestPath: (path) => {
            const reqPath = path.replace("/bundles/", "");
            if (reqPath.startsWith("/")) {
                return reqPath.slice(1);
            }
            return reqPath;
        },
        onNotFound: (path, c) => {
            console.debug("🔰 Heimdell: Static file not found", c.req.path, path);
        }
    })
);

app.get("/health", (c) => {
    return c.json({ status: "ok" });
});

app.route("", apiV1);

if (config.analytics?.route) {
    const {createAnalyticsRoute} = require("./routes/analytics");
    app.route("", createAnalyticsRoute(config.analytics.route, config.analytics.users));
    const userSource = config.analytics.users ? "dedicated analytics users" : "main users";
    console.debug(`🔰 Heimdell: Analytics dashboard available at ${config.analytics.route} (auth: ${userSource})`);
}

if (config.autoDelete?.enabled) {
    const {startCleanupScheduler} = require("./tasks/cleanupInactiveBundles");
    startCleanupScheduler();
}

console.debug("🔰 Heimdell: Running on port 8778");
export default {
    port: 8778,
    fetch: app.fetch
}
