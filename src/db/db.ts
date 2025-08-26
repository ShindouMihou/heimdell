import { Database } from "bun:sqlite";
import config from "../config";
import * as fs from "node:fs";
import * as path from "node:path";

try {
  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
} catch (_) {}

export const db = new Database(config.databasePath, {
    readwrite: true,
    strict: true,
    create: true,
})

require("./tables/bundle");
