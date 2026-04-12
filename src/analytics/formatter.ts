import {BundleAnalytics, TagSummary} from "../models/analytics";

const NUM_FMT = new Intl.NumberFormat("en-US");
const LINE = "==========================================================";
const DIVIDER = "----------------------------------------------------------";

function fmt(n: number): string {
    return NUM_FMT.format(n);
}

function pct(count: number, total: number): string {
    if (total === 0) return "  0.0%";
    return ((count / total) * 100).toFixed(1).padStart(5) + "%";
}

function padRight(str: string, len: number): string {
    return str.length >= len ? str : str + " ".repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
    return str.length >= len ? str : " ".repeat(len - str.length) + str;
}

export function formatBundleAnalytics(data: BundleAnalytics): string {
    const lines: string[] = [];

    lines.push(LINE);
    lines.push(`  HEIMDELL ANALYTICS - Bundle: ${data.bundle_id}`);
    lines.push(LINE);
    lines.push("");
    lines.push(`  Version:   ${data.version}`);
    lines.push(`  Tag:       ${data.tag}`);
    lines.push(`  Author:    ${data.author}`);
    lines.push(`  Created:   ${data.created_at}`);
    lines.push("");

    lines.push(DIVIDER);
    lines.push("  ACTIVITY SUMMARY");
    lines.push(DIVIDER);
    lines.push(`  Total Update Checks:  ${padLeft(fmt(data.total_update_checks), 10)}`);
    lines.push(`  Unique Devices:       ${padLeft(fmt(data.unique_devices), 10)}`);
    lines.push("");

    if (data.platform_breakdown.length > 0) {
        const total = data.platform_breakdown.reduce((s, p) => s + p.count, 0);
        lines.push(DIVIDER);
        lines.push("  PLATFORM BREAKDOWN");
        lines.push(DIVIDER);
        for (const p of data.platform_breakdown) {
            lines.push(`  ${padRight(p.platform, 12)} ${padLeft(fmt(p.count), 10)}  (${pct(p.count, total)})`);
        }
        lines.push("");
    }

    if (data.os_distribution.length > 0) {
        const total = data.os_distribution.reduce((s, o) => s + o.count, 0);
        lines.push(DIVIDER);
        lines.push("  OS DISTRIBUTION (Top 10)");
        lines.push(DIVIDER);
        for (const o of data.os_distribution) {
            lines.push(`  ${padRight(o.os, 16)} ${padLeft(fmt(o.count), 8)}  (${pct(o.count, total)})`);
        }
        lines.push("");
    }

    if (data.recent_activity.length > 0) {
        lines.push(DIVIDER);
        lines.push("  RECENT ACTIVITY (Last 7 Days)");
        lines.push(DIVIDER);
        lines.push(`  ${padRight("Date", 14)} ${padLeft("Checks", 10)}`);
        for (const a of data.recent_activity) {
            lines.push(`  ${padRight(a.date, 14)} ${padLeft(fmt(a.count), 10)}`);
        }
        lines.push("");
    }

    lines.push(LINE);
    return lines.join("\n");
}

export function formatTagAnalytics(tag: string, summary: TagSummary, bundles: BundleAnalytics[]): string {
    const lines: string[] = [];

    lines.push(LINE);
    lines.push(`  HEIMDELL ANALYTICS - Tag: ${tag}`);
    lines.push(LINE);
    lines.push("");
    lines.push(`  Total Bundles:        ${padLeft(fmt(summary.bundle_count), 10)}`);
    lines.push(`  Total Update Checks:  ${padLeft(fmt(summary.total_update_checks), 10)}`);
    lines.push(`  Unique Devices:       ${padLeft(fmt(summary.unique_devices), 10)}`);
    lines.push("");

    if (bundles.length > 0) {
        lines.push(DIVIDER);
        lines.push("  BUNDLES");
        lines.push(DIVIDER);
        lines.push(`  ${padRight("Bundle ID", 36)} ${padLeft("Version", 10)} ${padLeft("Checks", 10)} ${padLeft("Devices", 10)}`);
        lines.push(`  ${"-".repeat(36)} ${"-".repeat(10)} ${"-".repeat(10)} ${"-".repeat(10)}`);
        for (const b of bundles) {
            lines.push(`  ${padRight(b.bundle_id, 36)} ${padLeft(b.version, 10)} ${padLeft(fmt(b.total_update_checks), 10)} ${padLeft(fmt(b.unique_devices), 10)}`);
        }
        lines.push("");
    }

    for (const b of bundles) {
        if (b.total_update_checks > 0) {
            lines.push(formatBundleAnalytics(b));
            lines.push("");
        }
    }

    return lines.join("\n");
}

export function formatOverview(tags: TagSummary[]): string {
    const lines: string[] = [];

    lines.push(LINE);
    lines.push("  HEIMDELL ANALYTICS - Overview");
    lines.push(LINE);
    lines.push("");

    if (tags.length === 0) {
        lines.push("  No analytics data available yet.");
        lines.push("");
        lines.push(LINE);
        return lines.join("\n");
    }

    lines.push(`  ${padRight("Tag", 24)} ${padLeft("Bundles", 10)} ${padLeft("Checks", 10)} ${padLeft("Devices", 10)}`);
    lines.push(`  ${"-".repeat(24)} ${"-".repeat(10)} ${"-".repeat(10)} ${"-".repeat(10)}`);

    for (const t of tags) {
        lines.push(`  ${padRight(t.tag, 24)} ${padLeft(fmt(t.bundle_count), 10)} ${padLeft(fmt(t.total_update_checks), 10)} ${padLeft(fmt(t.unique_devices), 10)}`);
    }

    lines.push("");
    lines.push(LINE);
    return lines.join("\n");
}
