import { Hono } from 'hono'
import config from "./config";
import * as fs from "node:fs";
import {db} from "./db/db";
import {AppContextEnv} from "./types/hono";
import {apiV1} from "./routes/api/v1";
import {requestLogger} from "./middlewares/log";
import * as path from "node:path";
import {serveStatic} from "hono/bun";

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
app.use("/bundles/*", serveStatic({
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
}));
app.route("", apiV1);

console.debug("🔰 Heimdell: Running on port 8778");
export default {
    port: 8778,
    fetch: app.fetch
}
