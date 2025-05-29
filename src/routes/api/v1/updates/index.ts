import {Hono} from "hono";

export const updatesRoutes = new Hono().basePath("/updates");

// Routes are available in the files below, please do not
// remove this require import statement as it is necessary
// to load the routes.
require("./updates");
