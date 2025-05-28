import {Hono} from "hono";

export const apiV1 = new Hono().basePath("/api/v1")
