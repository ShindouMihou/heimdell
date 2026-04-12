import {Hono} from "hono";
import {AppContextEnv} from "../../types/hono";
import {createBasicAuth, useBasicAuth} from "../../middlewares/validate";
import {Analytics} from "../../models/analytics";
import {respondError} from "../../middlewares/response";
import {formatBundleAnalytics, formatOverview, formatTagAnalytics} from "../../analytics/formatter";
import {SAFE_PATH_SEGMENT} from "../../utils/pathSafety";
import {Hashed} from "../../config/ext/hashed";

const VALID_ROUTE = /^\/[a-zA-Z0-9\-_\/]+$/;

type UserMap = { [username: string]: string | Hashed };

export function createAnalyticsRoute(
    routePath: string,
    dedicatedUsers?: UserMap,
): Hono<AppContextEnv> {
    if (!VALID_ROUTE.test(routePath)) {
        throw new Error(`Invalid analytics route: "${routePath}" — must match ${VALID_ROUTE}`);
    }

    const app = new Hono<AppContextEnv>();
    const authMiddleware = dedicatedUsers ? createBasicAuth(dedicatedUsers) : useBasicAuth;

    app.get(routePath, authMiddleware, (c) => {
        const tag = c.req.query("tag");
        const bundleId = c.req.query("bundle");
        const wantsJson = c.req.header("accept")?.includes("application/json");

        if (bundleId && (bundleId.length > 128 || !SAFE_PATH_SEGMENT.test(bundleId))) {
            return respondError(c, 400, "Invalid bundle ID format.");
        }
        if (tag && (tag.length > 256 || !SAFE_PATH_SEGMENT.test(tag))) {
            return respondError(c, 400, "Invalid tag format.");
        }

        if (bundleId) {
            const data = Analytics.getByBundleId(bundleId);
            if (!data) {
                return respondError(c, 404, "Bundle not found.");
            }
            if (wantsJson) return c.json(data);
            return c.text(formatBundleAnalytics(data));
        }

        if (tag) {
            const { bundles, summary } = Analytics.getByTag(tag);
            if (wantsJson) return c.json({ summary, bundles });
            return c.text(formatTagAnalytics(tag, summary, bundles));
        }

        const overview = Analytics.getOverview();
        if (wantsJson) return c.json(overview);
        return c.text(formatOverview(overview));
    });

    return app;
}
