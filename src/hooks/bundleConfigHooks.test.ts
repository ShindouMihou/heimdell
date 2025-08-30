import { describe, test, expect } from "bun:test";
import { Bundle } from "../models/bundle";

describe("bundleConfigHooks unit tests", () => {
    test("Bundle creation works for hook testing", () => {
        const bundle = Bundle.create({
            version: "1.0.0",
            tag: "production",
            note: "Test bundle",
            author: "testuser"
        });

        expect(bundle.version).toBe("1.0.0");
        expect(bundle.tag).toBe("production");
        expect(bundle.note).toBe("Test bundle");
        expect(bundle.author).toBe("testuser");
        expect(bundle.is_disposed).toBe(false);
    });
});