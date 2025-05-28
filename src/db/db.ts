import { Database } from "bun:sqlite";
import config from "../config";

export const db = new Database(config.databasePath, {
    readwrite: true,
    strict: true,
    create: true,
})

require("./tables/bundle");
