import {Context} from "hono";
import {StatusCode} from "hono/utils/http-status";

export const respondInvalidRequest =
    (context: Context) => respondError(context, 400, "Invalid Request")

export const respondForbidden =
    (context: Context) => respondError(context, 403, "Invalid authentication.")

export function respondError(context: Context, status: StatusCode, error: string) {
    context.status(status)
    return context.json({error})
}
