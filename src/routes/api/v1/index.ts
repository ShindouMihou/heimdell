import {Hono} from "hono";
import {cliRoutes} from "./cli";
import {updatesRoutes} from "./updates";
import {useBasicAuth} from "../../../middlewares/validate";

export const apiV1 = new Hono().basePath("/api/v1");

apiV1.get(
    "/auth/login",
    useBasicAuth,
    (c) => c.text("OK")
)
apiV1.route("", cliRoutes);
apiV1.route("", updatesRoutes);
