import {db} from "../db/db";
import {Bundle} from "../models/bundle";
import {BundleEvent} from "../models/bundleEvent";
import {onBundleDispose} from "../hooks/bundleConfigHooks";
import {safeBundlePath} from "../utils/pathSafety";
import config from "../config";
import * as fs from "node:fs";
import * as path from "node:path";

const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000;
const GRACE_FILE_NAME = ".auto_delete_enabled_at";

let isRunning = false;

const candidatesStmt = db.prepare(`
    SELECT b.*
    FROM bundles b
    WHERE b.is_disposed = 0
    AND COALESCE(
        (SELECT MAX(be.created_at) FROM bundle_events be WHERE be.bundle_id = b.id),
        b.created_at
    ) < $cutoff
`);

const activeCountStmt = db.prepare(`
    SELECT COUNT(*) as count FROM bundles
    WHERE version = $version AND tag = $tag AND is_disposed = 0
`);

const disposeStmt = db.prepare(
    "UPDATE bundles SET is_disposed = 1 WHERE id = $id AND is_disposed = 0"
);

const disposeInTransaction = db.transaction((bundleId: string, version: string, tag: string): boolean => {
    const result = activeCountStmt.get({ version, tag }) as { count: number };
    if (result.count <= 1) return false;

    disposeStmt.run({ id: bundleId });
    return true;
});

function getGraceFilePath(): string {
    return path.join(config.storagePath, GRACE_FILE_NAME);
}

function getGraceTimestamp(): Date | null {
    const filePath = getGraceFilePath();
    try {
        const content = fs.readFileSync(filePath, "utf-8").trim();
        const date = new Date(content);
        if (isNaN(date.getTime())) return null;
        return date;
    } catch {
        return null;
    }
}

function ensureGraceFile(): Date {
    const existing = getGraceTimestamp();
    if (existing) return existing;

    const now = new Date();
    fs.mkdirSync(path.dirname(getGraceFilePath()), { recursive: true });
    fs.writeFileSync(getGraceFilePath(), now.toISOString());
    console.debug("🔰 Heimdell: Auto-deletion grace period started at", now.toISOString());
    return now;
}

function isGracePeriodOver(): boolean {
    const enabledAt = ensureGraceFile();
    return (Date.now() - enabledAt.getTime()) >= GRACE_PERIOD_MS;
}

async function deleteFilesFromDisk(bundle: Bundle): Promise<void> {
    try {
        const folderPath = safeBundlePath(config.storagePath, bundle.tag, bundle.version, bundle.id);
        await fs.promises.rm(folderPath, { recursive: true, force: true });
    } catch (e) {
        console.error(`⚠️ Heimdell: Failed to delete files for bundle ${bundle.id}:`, e);
    }
}

async function cleanupInactiveBundles(): Promise<void> {
    if (isRunning) {
        console.debug("🔰 Heimdell: Cleanup already in progress, skipping.");
        return;
    }

    isRunning = true;

    try {
        if (!isGracePeriodOver()) {
            const enabledAt = getGraceTimestamp();
            const remaining = enabledAt
                ? Math.ceil((GRACE_PERIOD_MS - (Date.now() - enabledAt.getTime())) / (60 * 60 * 1000))
                : 48;
            console.debug(`🔰 Heimdell: Auto-deletion grace period active (~${remaining}h remaining). Skipping cleanup.`);
            return;
        }

        const inactivityDays = Math.max(config.autoDelete?.inactivityDays ?? 30, 14);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - inactivityDays);

        const candidates = candidatesStmt.all({ cutoff: cutoff.toISOString() }) as {
            id: string; version: string; tag: string; note: string;
            author: string; is_disposed: number; is_force_upgrade: number; created_at: string;
        }[];

        let disposed = 0;
        let skipped = 0;

        for (const row of candidates) {
            const wasDisposed = disposeInTransaction(row.id, row.version, row.tag);

            if (!wasDisposed) {
                skipped++;
                console.debug(`🔰 Heimdell: Skipped bundle ${row.id} (last active for ${row.version}+${row.tag})`);
                continue;
            }

            const bundle = Bundle.from({
                id: row.id, version: row.version, tag: row.tag,
                note: row.note, author: row.author,
                is_disposed: true,
                is_force_upgrade: Boolean(row.is_force_upgrade),
                created_at: row.created_at,
            });

            await deleteFilesFromDisk(bundle);

            disposed++;
            console.debug(`🔰 Heimdell: Disposed inactive bundle ${row.id} (tag=${row.tag}, version=${row.version})`);

            onBundleDispose(bundle).catch(e =>
                console.error(`⚠️ Heimdell: onBundleDispose hook failed for ${bundle.id}:`, e)
            );
        }

        const pruneRetentionDays = Math.max(inactivityDays * 3, 90);
        const pruned = BundleEvent.pruneOlderThan(pruneRetentionDays);

        console.debug(
            `🔰 Heimdell: Cleanup complete — ${disposed} bundles disposed, ${skipped} skipped (last for version+tag), ${pruned} old events pruned.`
        );
    } catch (e) {
        console.error("⚠️ Heimdell: Cleanup task failed:", e);
    } finally {
        isRunning = false;
    }
}

export function startCleanupScheduler(): { stop: () => void } {
    const intervalMinutes = config.autoDelete?.intervalMinutes ?? 60;
    const inactivityDays = Math.max(config.autoDelete?.inactivityDays ?? 30, 14);

    if ((config.autoDelete?.inactivityDays ?? 30) < 14) {
        console.warn("⚠️ Heimdell: autoDelete.inactivityDays is below minimum (14). Using 14 days.");
    }

    console.debug(
        `🔰 Heimdell: Auto-deletion scheduler started. Interval: ${intervalMinutes}m, Inactivity threshold: ${inactivityDays} days`
    );

    cleanupInactiveBundles();

    const handle = setInterval(cleanupInactiveBundles, intervalMinutes * 60 * 1000);

    return {
        stop: () => {
            clearInterval(handle);
            console.debug("🔰 Heimdell: Auto-deletion scheduler stopped.");
        },
    };
}
