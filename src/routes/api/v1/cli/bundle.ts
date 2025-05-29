import {cliRoutes} from "./index";
import {useBasicAuth, validate} from "../../../../middlewares/validate";
import {Bundle, CreateBundleParams, CreateBundleParamsSchema} from "../../../../models/bundle";
import {respondError} from "../../../../middlewares/response";
import config from "../../../../config";
import * as path from "node:path";
import {requiresBundle} from "../../../../middlewares/bundle";
import {uploadBundleFile} from "../../../../helpers/bundle/uploadBundleFile";

cliRoutes.post(
    "/bundle/reserve",
    useBasicAuth,
    validate(CreateBundleParamsSchema),
    (context) => {
        const { version, note, tag }: CreateBundleParams = context.req.valid('json');
        if (!config.tags.includes(tag)) {
            return respondError(context, 400, "Invalid tag specified.");
        }
        const bundle = Bundle.create({ version, note, tag, author: context.get("user") });
        bundle.save();

        return context.json(bundle)
    }
);

cliRoutes.get(
    "/bundles/:tag/list",
    useBasicAuth,
    (context) => {
            const tag = context.req.param("tag");
            if (!config.tags.includes(tag)) {
                    return respondError(context, 400, "Invalid tag specified.");
            }
            const bundles = Bundle.getAll({ tag: tag });
            return context.json(bundles);
    }
)

cliRoutes.delete(
    "/bundle/:id",
    useBasicAuth,
    requiresBundle,
    (context) => {
        const bundle = context.get("bundle")!;
        bundle.dispose();

        return context.json({ message: "Bundle has been disposed." })
    }
);

cliRoutes.post(
    "/bundle/:id/upload",
    useBasicAuth,
    requiresBundle,
    async (context) => {
        const bundle = context.get("bundle")!;
        const body = await context.req.parseBody();
        const android = body['android'] as File;
        const ios = body['ios'] as File;

        if (!android && !ios) {
            return respondError(context, 400, "No bundle file provided for any of: ios, android");
        }

        const folderPath = path.join(config.storagePath, "bundles", bundle.tag, bundle.version, bundle.id)
        let errorResponse;
        errorResponse = await uploadBundleFile(context, android, folderPath, "index.android.bundle.zip", "Android");
        if (errorResponse) return errorResponse;
        errorResponse = await uploadBundleFile(context, ios, folderPath, "main.jsbundle.zip", "iOS");
        if (errorResponse) return errorResponse;

        return context.json({ message: "Bundle has been uploaded." })
    }
);
