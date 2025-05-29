import {Hono} from "hono";
import {cliRoutes} from "./cli";
import {updatesRoutes} from "./updates";

export const apiV1 = new Hono().basePath("/api/v1");

apiV1.route("", cliRoutes);
apiV1.route("", updatesRoutes);
