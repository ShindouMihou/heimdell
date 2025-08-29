import {Bundle} from "../models/bundle";
import config from "../config";
import {retriable} from "../utils/retriable";

function onBundleHook(hook: ((bundle: Bundle, environment: string) => Promise<void>) | undefined, name: string) {
    return async (bundle: Bundle) => {
        if (!hook) {
            return;
        }

        console.log(`🔰 Heimdell: Triggering ${name} hook for bundle ID:`, bundle.id, "Version:", bundle.version);
        try {
            const retriableHook = retriable(hook, 5);
            await retriableHook(bundle, config.environmentName);
        } catch(e) {
            console.error(`⚠️ Heimdell: ${name} hook failed to trigger for bundle ID:`, bundle.id, "Version:", bundle.version, " after 5 retries.", e);
        }
    }
}

export const onBundlePush = onBundleHook(config.onBundlePush, "onBundlePush");
export const onBundleRollback = onBundleHook(config.onBundleRollback, "onBundleRollback");
export const onBundleDispose = onBundleHook(config.onBundleDispose, "onBundleDispose");
export const onBundleReserve = onBundleHook(config.onBundleReserve, "onBundleReserve");