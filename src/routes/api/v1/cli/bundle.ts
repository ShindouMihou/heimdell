import {cliRoutes} from "./index";
import {useBasicAuth, validate} from "../../../../middlewares/validate";
import {Bundle, CreateBundleParams, CreateBundleParamsSchema} from "../../../../models/bundle";
import {respondError} from "../../../../middlewares/response";
import config from "../../../../config";
import * as path from "node:path";
import {requiresBundle} from "../../../../middlewares/bundle";
import {uploadBundleFile} from "../../../../helpers/bundle/uploadBundleFile";
import {onBundleDispose, onBundlePush, onBundleReserve, onBundleRollback} from "../../../../hooks/bundleConfigHooks";

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

        onBundleReserve(bundle).then();
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
);

cliRoutes.post(
    "/bundles/:tag/rollback",
    useBasicAuth,
    (context) => {
        const tag = context.req.param("tag");
        if (!config.tags.includes(tag)) {
            return respondError(context, 400, "Invalid tag specified.");
        }
        const bundles = Bundle.getAll({ tag: tag, includeDisposed: false });
        if (bundles.length === 0) {
            return respondError(context, 404, "No bundles found for the specified tag.");
        }

        // Sort bundles by created_at in newest first
        bundles.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        const latestBundle = bundles[0];

        latestBundle.dispose();
        onBundleRollback(latestBundle).then();
        return context.json({ message: "OK", disposed_bundle: latestBundle });
    }
)

cliRoutes.delete(
    "/bundle/:id",
    useBasicAuth,
    requiresBundle,
    (context) => {
        const bundle = context.get("bundle")!;
        bundle.dispose();

        onBundleDispose(bundle).then();
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

        onBundlePush(bundle).then();
        return context.json({ message: "Bundle has been uploaded." })
    }
);
