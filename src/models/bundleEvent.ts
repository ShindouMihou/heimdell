import {db} from "../db/db";
import {DeviceInfo} from "../analytics/extractDeviceInfo";

type EventType = "update_check" | "download";
type Platform = "android" | "ios" | "unknown";

const insertStmt = db.prepare(`
    INSERT INTO bundle_events (bundle_id, event_type, platform, device_id, device_os, user_agent, ip_address, created_at)
    VALUES ($bundle_id, $event_type, $platform, $device_id, $device_os, $user_agent, $ip_address, $created_at)
`);

const lastActivityStmt = db.prepare(`
    SELECT MAX(created_at) as last_activity FROM bundle_events WHERE bundle_id = $bundle_id
`);

const pruneStmt = db.prepare(`
    DELETE FROM bundle_events WHERE created_at < $cutoff
`);

const hasAnyEventsStmt = db.prepare(`
    SELECT EXISTS(SELECT 1 FROM bundle_events LIMIT 1) as has_events
`);

export class BundleEvent {
    static record(bundleId: string, eventType: EventType, platform: Platform, deviceInfo: DeviceInfo): void {
        insertStmt.run({
            bundle_id: bundleId,
            event_type: eventType,
            platform: platform,
            device_id: deviceInfo.device_id,
            device_os: deviceInfo.device_os,
            user_agent: deviceInfo.user_agent,
            ip_address: deviceInfo.ip_address,
            created_at: new Date().toISOString(),
        });
    }

    static getLastActivityDate(bundleId: string): string | null {
        const result = lastActivityStmt.get({ bundle_id: bundleId }) as { last_activity: string | null } | null;
        return result?.last_activity ?? null;
    }

    static pruneOlderThan(days: number): number {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const result = pruneStmt.run({ cutoff: cutoff.toISOString() });
        return result.changes;
    }

    static hasAnyEvents(): boolean {
        const result = hasAnyEventsStmt.get() as { has_events: number } | null;
        return (result?.has_events ?? 0) > 0;
    }
}
