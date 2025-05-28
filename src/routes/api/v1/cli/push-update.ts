import {cliRoutes} from "./index";
import {useBasicAuth, validate} from "../../../../middlewares/validate";
import {Bundle, CreateBundleParams, CreateBundleParamsSchema} from "../../../../models/bundle";
import {respondError} from "../../../../middlewares/response";
import config from "../../../../config";
import * as path from "node:path";

cliRoutes.post(
    "/reserve",
    useBasicAuth,
    validate(CreateBundleParamsSchema),
    (context) => {
        const { version, note, tag }: CreateBundleParams = context.req.valid('json')
        const bundle = Bundle.create({ version, note, tag, author: context.get("user" as never) as string });
        return context.json(bundle)
    }
);

cliRoutes.post(
    "/bundle/:id/upload",
    useBasicAuth,
    async (context) => {
        const bundle = Bundle.getById(context.req.param('id'))
        if (!bundle) {
            return respondError(context, 400, "Unknown bundle identifier provided.")
        }

        const body = await context.req.parseBody();
        const android = body['android'] as File;
        const ios = body['ios'] as File;

        if (!android && !ios) {
            return respondError(context, 400, "No bundle file provided for any of: ios, android");
        }

        const folderPath = path.join(config.storagePath, "bundles", bundle.tag, bundle.version, bundle.id)
        if (android) {
            try {
                const buffer = await android.arrayBuffer();
                await Bun.file(path.join(folderPath, "index.android.bundle.zip")).write(buffer);
            } catch (e: any) {
                return respondError(context, 500, `Failed to create Android bundle: ${e?.message ?? "Unknown error"}`)
            }
        }

        if (ios) {
            try {
                const buffer = await ios.arrayBuffer();
                await Bun.file(path.join(folderPath, "main.jsbundle.zip")).write(buffer);
            } catch (e: any) {
                return respondError(context, 500, `Failed to create iOS bundle: ${e?.message ?? "Unknown error"}`)
            }
        }

        return context.json({ message: "Bundle has been uploaded." })
    }
)
