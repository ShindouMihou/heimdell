import {describe, test, expect} from "bun:test";
import {CreateBundleParamsSchema} from "./bundle";

describe("CreateBundleParamsSchema - path safety", () => {
    test("should accept valid version with dots and hyphens", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "1.0.0-beta.2",
            tag: "production",
        });
        expect(result.success).toBe(true);
    });

    test("should accept valid tag with underscores", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "1.0.0",
            tag: "my_app",
        });
        expect(result.success).toBe(true);
    });

    test("should reject version with path traversal", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "../../etc",
            tag: "production",
        });
        expect(result.success).toBe(false);
    });

    test("should reject version with slashes", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "1.0/bad",
            tag: "production",
        });
        expect(result.success).toBe(false);
    });

    test("should reject tag with path traversal", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "1.0.0",
            tag: "../secret",
        });
        expect(result.success).toBe(false);
    });

    test("should reject version with spaces", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "1.0 0",
            tag: "production",
        });
        expect(result.success).toBe(false);
    });

    test("should reject tag with special characters", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "1.0.0",
            tag: "app@latest",
        });
        expect(result.success).toBe(false);
    });

    test("should reject version with backslashes", () => {
        const result = CreateBundleParamsSchema.safeParse({
            version: "1.0\\bad",
            tag: "production",
        });
        expect(result.success).toBe(false);
    });
});
