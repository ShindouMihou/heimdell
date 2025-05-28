import { Hono } from 'hono'
import config from "./config";
import * as fs from "node:fs";
import {db} from "./db/db";

console.debug("Heimdell: Preparing the filesystem service...")
try {
    fs.mkdirSync(config.storagePath, { recursive: true });
} catch (e) {}
db.run(`PRAGMA journal_mode = WAL;`);

const app = new Hono()
export default app
