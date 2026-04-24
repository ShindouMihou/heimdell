import { describe, test, expect } from "bun:test";
import { Bundle } from "./bundle";

describe("Bundle.hasForceUpgradeAfter", () => {
    const testTag = "test_force_upgrade_helper";

    test("returns false when no force-upgrade bundles exist for (version, tag)", () => {
        const v = "hfua.1.0.0";
        const regular = Bundle.create({
            version: v, tag: testTag, note: "regular", author: "tester",
        });
        regular.save();
        expect(Bundle.hasForceUpgradeAfter(v, testTag)).toBe(false);
    });

    test("returns true when any non-disposed force-upgrade bundle exists (no afterBundleId)", () => {
        const v = "hfua.2.0.0";
        const flagged = Bundle.create({
            version: v, tag: testTag, note: "flagged", author: "tester", is_force_upgrade: true,
        });
        flagged.save();
        expect(Bundle.hasForceUpgradeAfter(v, testTag)).toBe(true);
    });

    test("ignores disposed force-upgrade bundles", () => {
        const v = "hfua.3.0.0";
        const flagged = Bundle.create({
            version: v, tag: testTag, note: "flagged-disposed", author: "tester", is_force_upgrade: true,
        });
        flagged.save();
        flagged.dispose();
        expect(Bundle.hasForceUpgradeAfter(v, testTag)).toBe(false);
    });

    test("returns false when afterBundleId is unknown (no fabricated stickiness)", () => {
        const v = "hfua.4.0.0";
        const flagged = Bundle.create({
            version: v, tag: testTag, note: "flagged", author: "tester", is_force_upgrade: true,
        });
        flagged.save();
        expect(Bundle.hasForceUpgradeAfter(v, testTag, "does-not-exist-1234")).toBe(false);
    });

    test("returns true when a flagged bundle sits strictly after the reference", async () => {
        const v = "hfua.5.0.0";
        const older = Bundle.create({
            version: v, tag: testTag, note: "older", author: "tester",
        });
        older.save();
        await Bun.sleep(10);
        const flagged = Bundle.create({
            version: v, tag: testTag, note: "flagged", author: "tester", is_force_upgrade: true,
        });
        flagged.save();
        expect(Bundle.hasForceUpgradeAfter(v, testTag, older.id)).toBe(true);
    });

    test("returns false when the only flagged bundle is at or before the reference", async () => {
        const v = "hfua.6.0.0";
        const flagged = Bundle.create({
            version: v, tag: testTag, note: "flagged", author: "tester", is_force_upgrade: true,
        });
        flagged.save();
        await Bun.sleep(10);
        const newer = Bundle.create({
            version: v, tag: testTag, note: "newer", author: "tester",
        });
        newer.save();
        expect(Bundle.hasForceUpgradeAfter(v, testTag, newer.id)).toBe(false);
    });

    test("upToCreatedAt excludes flagged bundles created after the upper bound", async () => {
        const v = "hfua.7.0.0";
        const older = Bundle.create({
            version: v, tag: testTag, note: "older", author: "tester",
        });
        older.save();
        await Bun.sleep(10);
        const middle = Bundle.create({
            version: v, tag: testTag, note: "middle-target", author: "tester",
        });
        middle.save();
        await Bun.sleep(10);
        const future = Bundle.create({
            version: v, tag: testTag, note: "future-flagged", author: "tester", is_force_upgrade: true,
        });
        future.save();

        expect(Bundle.hasForceUpgradeAfter(v, testTag, older.id, middle.created_at)).toBe(false);
        expect(Bundle.hasForceUpgradeAfter(v, testTag, older.id, future.created_at)).toBe(true);
    });
});
