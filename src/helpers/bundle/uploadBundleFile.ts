import {Context} from "hono";
import {AppContextEnv} from "../../types/hono";
import * as path from "node:path";
import {respondError} from "../../middlewares/response";

export async function uploadBundleFile(
    context: Context<AppContextEnv>,
    file: File | undefined,
    folderPath: string,
    fileName: string,
    platformName: string
): Promise<Response | null> {
    if (!file) {
        return null;
    }
    try {
        const buffer = await file.arrayBuffer();
        await Bun.write(path.join(folderPath, fileName), buffer);
        return null;
    } catch (e: any) {
        return respondError(context, 500, `Failed to save ${platformName} bundle: ${e?.message ?? "Unknown error"}`);
    }
}
