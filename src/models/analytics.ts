import {db} from "../db/db";

export interface BundleAnalytics {
    bundle_id: string;
    version: string;
    tag: string;
    author: string;
    created_at: string;
    total_update_checks: number;
    unique_devices: number;
    platform_breakdown: { platform: string; count: number }[];
    os_distribution: { os: string; count: number }[];
    recent_activity: { date: string; count: number }[];
}

export interface TagSummary {
    tag: string;
    total_update_checks: number;
    unique_devices: number;
    bundle_count: number;
}

const eventCountsByBundleStmt = db.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM bundle_events
    WHERE bundle_id = $bundle_id
    GROUP BY event_type
`);

const uniqueDevicesByBundleStmt = db.prepare(`
    SELECT COUNT(DISTINCT device_id) as unique_devices
    FROM bundle_events
    WHERE bundle_id = $bundle_id AND device_id IS NOT NULL
`);

const platformBreakdownStmt = db.prepare(`
    SELECT platform, COUNT(*) as count
    FROM bundle_events
    WHERE bundle_id = $bundle_id
    GROUP BY platform
    ORDER BY count DESC
`);

const osDistributionStmt = db.prepare(`
    SELECT device_os, COUNT(*) as count
    FROM bundle_events
    WHERE bundle_id = $bundle_id AND device_os IS NOT NULL
    GROUP BY device_os
    ORDER BY count DESC
    LIMIT 10
`);

const recentActivityStmt = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM bundle_events
    WHERE bundle_id = $bundle_id AND created_at >= DATE('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
`);

const bundleInfoStmt = db.prepare(`
    SELECT id, version, tag, author, created_at
    FROM bundles
    WHERE id = $bundle_id
`);

const bundlesByTagStmt = db.prepare(`
    SELECT b.id, b.version, b.tag, b.author, b.created_at,
           COUNT(be.id) as total_update_checks,
           COUNT(DISTINCT be.device_id) as unique_devices
    FROM bundles b
    LEFT JOIN bundle_events be ON b.id = be.bundle_id
    WHERE b.tag = $tag AND b.is_disposed = 0
    GROUP BY b.id
    ORDER BY b.created_at DESC
`);

const uniqueDevicesByTagStmt = db.prepare(`
    SELECT COUNT(DISTINCT be.device_id) as unique_devices
    FROM bundle_events be
    JOIN bundles b ON be.bundle_id = b.id
    WHERE b.tag = $tag AND b.is_disposed = 0 AND be.device_id IS NOT NULL
`);

const overviewStmt = db.prepare(`
    SELECT b.tag,
           COUNT(DISTINCT b.id) as bundle_count,
           COUNT(be.id) as total_update_checks,
           COUNT(DISTINCT be.device_id) as unique_devices
    FROM bundles b
    LEFT JOIN bundle_events be ON b.id = be.bundle_id
    WHERE b.is_disposed = 0
    GROUP BY b.tag
    ORDER BY total_update_checks DESC
`);

export class Analytics {
    static getByBundleId(bundleId: string): BundleAnalytics | null {
        const info = bundleInfoStmt.get({ bundle_id: bundleId }) as {
            id: string; version: string; tag: string; author: string; created_at: string;
        } | null;

        if (!info) return null;

        const eventCounts = eventCountsByBundleStmt.all({ bundle_id: bundleId }) as { event_type: string; count: number }[];
        const updateChecks = eventCounts.find(e => e.event_type === "update_check")?.count ?? 0;

        const uniqueDevicesRow = uniqueDevicesByBundleStmt.get({ bundle_id: bundleId }) as { unique_devices: number } | null;
        const uniqueDevices = uniqueDevicesRow?.unique_devices ?? 0;
        const platformBreakdown = platformBreakdownStmt.all({ bundle_id: bundleId }) as { platform: string; count: number }[];
        const osDistribution = osDistributionStmt.all({ bundle_id: bundleId }) as { device_os: string; count: number }[];
        const recentActivity = recentActivityStmt.all({ bundle_id: bundleId }) as { date: string; count: number }[];

        return {
            bundle_id: info.id,
            version: info.version,
            tag: info.tag,
            author: info.author,
            created_at: info.created_at,
            total_update_checks: updateChecks,
            unique_devices: uniqueDevices,
            platform_breakdown: platformBreakdown,
            os_distribution: osDistribution.map(r => ({ os: r.device_os, count: r.count })),
            recent_activity: recentActivity,
        };
    }

    static getByTag(tag: string): { bundles: BundleAnalytics[]; summary: TagSummary } {
        const rows = bundlesByTagStmt.all({ tag }) as {
            id: string; version: string; tag: string; author: string; created_at: string;
            total_update_checks: number; unique_devices: number;
        }[];

        let totalChecks = 0;

        const bundles: BundleAnalytics[] = rows.map(row => {
            totalChecks += row.total_update_checks;

            const platformBreakdown = platformBreakdownStmt.all({ bundle_id: row.id }) as { platform: string; count: number }[];
            const osDistribution = osDistributionStmt.all({ bundle_id: row.id }) as { device_os: string; count: number }[];
            const recentActivity = recentActivityStmt.all({ bundle_id: row.id }) as { date: string; count: number }[];

            return {
                bundle_id: row.id,
                version: row.version,
                tag: row.tag,
                author: row.author,
                created_at: row.created_at,
                total_update_checks: row.total_update_checks,
                unique_devices: row.unique_devices,
                platform_breakdown: platformBreakdown,
                os_distribution: osDistribution.map(r => ({ os: r.device_os, count: r.count })),
                recent_activity: recentActivity,
            };
        });

        const tagDevicesRow = uniqueDevicesByTagStmt.get({ tag }) as { unique_devices: number } | null;

        return {
            bundles,
            summary: {
                tag,
                total_update_checks: totalChecks,
                unique_devices: tagDevicesRow?.unique_devices ?? 0,
                bundle_count: rows.length,
            },
        };
    }

    static getOverview(): TagSummary[] {
        return overviewStmt.all() as TagSummary[];
    }
}
