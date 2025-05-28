import {Hono} from "hono";

export const cliRoutes = new Hono().basePath("/cli");
