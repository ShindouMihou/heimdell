import {MiddlewareHandler} from "hono";
import {AppContextEnv} from "../types/hono";
import {Bundle} from "../models/bundle";
import {respondError} from "./response";

export const requiresBundle: MiddlewareHandler<AppContextEnv> = async (context, next) => {
    const bundleId = context.req.param('id');
    if (bundleId === undefined) {
        return respondError(context, 400, "Unknown bundle identifier provided.")
    }

    const bundle = Bundle.getById(bundleId);
    if (!bundle) {
        return respondError(context, 404, "Bundle not found.");
    }
    context.set("bundle", bundle);
    await next();
};
