import {describe, test, expect} from "bun:test";
import {formatBundleAnalytics, formatOverview, formatTagAnalytics} from "./formatter";
import {BundleAnalytics, TagSummary} from "../models/analytics";

const sampleBundle: BundleAnalytics = {
    bundle_id: "1.0.0-myapp-abc12345",
    version: "1.0.0",
    tag: "myapp",
    author: "admin",
    created_at: "2026-04-10T14:30:00Z",
    total_update_checks: 3891,
    unique_devices: 482,
    platform_breakdown: [
        {platform: "android", count: 2280},
        {platform: "ios", count: 1611},
    ],
    os_distribution: [
        {os: "Android 14", count: 312},
        {os: "iOS 17.4", count: 289},
    ],
    recent_activity: [
        {date: "2026-04-12", count: 215},
        {date: "2026-04-11", count: 380},
    ],
};

describe("formatBundleAnalytics", () => {
    test("should include bundle metadata", () => {
        const output = formatBundleAnalytics(sampleBundle);
        expect(output).toContain("1.0.0-myapp-abc12345");
        expect(output).toContain("Version:   1.0.0");
        expect(output).toContain("Tag:       myapp");
        expect(output).toContain("Author:    admin");
    });

    test("should include activity summary with formatted numbers", () => {
        const output = formatBundleAnalytics(sampleBundle);
        expect(output).toContain("3,891");
        expect(output).toContain("482");
    });

    test("should include platform breakdown with percentages", () => {
        const output = formatBundleAnalytics(sampleBundle);
        expect(output).toContain("android");
        expect(output).toContain("ios");
        expect(output).toContain("2,280");
        expect(output).toContain("1,611");
    });

    test("should include OS distribution", () => {
        const output = formatBundleAnalytics(sampleBundle);
        expect(output).toContain("Android 14");
        expect(output).toContain("iOS 17.4");
    });

    test("should include recent activity", () => {
        const output = formatBundleAnalytics(sampleBundle);
        expect(output).toContain("2026-04-12");
        expect(output).toContain("215");
    });

    test("should handle empty data gracefully", () => {
        const emptyBundle: BundleAnalytics = {
            ...sampleBundle,
            total_update_checks: 0,
            unique_devices: 0,
            platform_breakdown: [],
            os_distribution: [],
            recent_activity: [],
        };
        const output = formatBundleAnalytics(emptyBundle);
        expect(output).toContain("0");
        expect(output).not.toContain("PLATFORM BREAKDOWN");
        expect(output).not.toContain("OS DISTRIBUTION");
        expect(output).not.toContain("RECENT ACTIVITY");
    });
});

describe("formatOverview", () => {
    test("should display tag summary table", () => {
        const tags: TagSummary[] = [
            {tag: "myapp", total_update_checks: 5000, unique_devices: 800, bundle_count: 12},
            {tag: "admin", total_update_checks: 200, unique_devices: 50, bundle_count: 3},
        ];
        const output = formatOverview(tags);
        expect(output).toContain("myapp");
        expect(output).toContain("admin");
        expect(output).toContain("5,000");
        expect(output).toContain("800");
    });

    test("should handle empty overview", () => {
        const output = formatOverview([]);
        expect(output).toContain("No analytics data available yet.");
    });
});

describe("formatTagAnalytics", () => {
    test("should display tag summary and bundle list", () => {
        const summary: TagSummary = {
            tag: "myapp",
            total_update_checks: 3891,
            unique_devices: 482,
            bundle_count: 1,
        };
        const output = formatTagAnalytics("myapp", summary, [sampleBundle]);
        expect(output).toContain("Tag: myapp");
        expect(output).toContain("BUNDLES");
        expect(output).toContain("1.0.0-myapp-abc12345");
    });
});
