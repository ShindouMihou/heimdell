import {updatesRoutes} from "./index";
import {respondError} from "../../../../middlewares/response";
import {Bundle} from "../../../../models/bundle";
import * as path from "node:path";
import config from "../../../../config";

updatesRoutes.get(
    "/:platform/:version",
    async (context) => {
        const platform = context.req.param("platform");
        const version = context.req.param("version");
        const tag = context.req.query("tag");

        const currentBundleVersion = context.req.query("current_bundle");

        if (!["android", "ios"].includes(platform)) {
            return respondError(context, 400, "Invalid platform specified.");
        }

        if (!version) {
            return respondError(context, 400, "No version specified.");
        }

        if (!tag) {
            return respondError(context, 400, "No tag specified.");
        }

        const bundle = Bundle.getByVersionTag(version, tag);
        if (!bundle) {
            return respondError(context, 404, "No updates found for this version and platform.");
        }

        if (bundle.id === currentBundleVersion) {
            return respondError(context, 404, "You are already at the latest version.");
        }

        const folderPath = path.join(config.storagePath, "bundles", bundle.tag, bundle.version, bundle.id);

        const android = Bun.file(
            path.join(folderPath, "index.android.bundle.zip")
        );

        const ios = Bun.file(
            path.join(folderPath, "main.jsbundle.zip")
        );

        const doesAndroidHaveBundle = await android.exists();
        const doesIosHaveBundle = await ios.exists();

        if (platform === "android" && !doesAndroidHaveBundle) {
            return respondError(context, 404, "Android bundle not found.");
        }

        if (platform === "ios" && !doesIosHaveBundle) {
            return respondError(context, 404, "iOS bundle not found.");
        }

        return context.json({
            update: {
                download: platform === "ios" ?
                    "bundles/" + bundle.tag + "/" + bundle.version + "/" + bundle.id + "/main.jsbundle.zip" :
                    "bundles/" + bundle.tag + "/" + bundle.version + "/" + bundle.id + "/index.android.bundle.zip",
                bundleId: bundle.id,
            }
        });
    }
);
