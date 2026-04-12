import {describe, test, expect} from "bun:test";
import {SAFE_PATH_SEGMENT, safeBundlePath} from "./pathSafety";

describe("SAFE_PATH_SEGMENT", () => {
    test("should allow alphanumeric characters", () => {
        expect(SAFE_PATH_SEGMENT.test("abc123")).toBe(true);
    });

    test("should allow dots, hyphens, and underscores", () => {
        expect(SAFE_PATH_SEGMENT.test("1.0.0")).toBe(true);
        expect(SAFE_PATH_SEGMENT.test("my-app")).toBe(true);
        expect(SAFE_PATH_SEGMENT.test("my_app")).toBe(true);
        expect(SAFE_PATH_SEGMENT.test("1.0.0-beta_2")).toBe(true);
    });

    test("should reject path traversal sequences", () => {
        expect(SAFE_PATH_SEGMENT.test("../")).toBe(false);
        expect(SAFE_PATH_SEGMENT.test("../../etc")).toBe(false);
    });

    test("should match dots alone (safeBundlePath handles . and .. rejection)", () => {
        expect(SAFE_PATH_SEGMENT.test("..")).toBe(true);
        expect(SAFE_PATH_SEGMENT.test(".")).toBe(true);
    });

    test("should reject slashes", () => {
        expect(SAFE_PATH_SEGMENT.test("a/b")).toBe(false);
        expect(SAFE_PATH_SEGMENT.test("a\\b")).toBe(false);
    });

    test("should reject spaces and special characters", () => {
        expect(SAFE_PATH_SEGMENT.test("my app")).toBe(false);
        expect(SAFE_PATH_SEGMENT.test("app@1.0")).toBe(false);
        expect(SAFE_PATH_SEGMENT.test("app#1")).toBe(false);
        expect(SAFE_PATH_SEGMENT.test("")).toBe(false);
    });
});

describe("safeBundlePath", () => {
    const storagePath = "/tmp/test-storage";

    test("should return resolved path for valid segments", () => {
        const result = safeBundlePath(storagePath, "myapp", "1.0.0", "1.0.0-myapp-abc12345");
        expect(result).toContain("/tmp/test-storage/bundles/myapp/1.0.0/1.0.0-myapp-abc12345");
    });

    test("should throw for path traversal in version", () => {
        expect(() => safeBundlePath(storagePath, "myapp", "../..", "id")).toThrow("disallowed characters");
    });

    test("should throw for path traversal in tag", () => {
        expect(() => safeBundlePath(storagePath, "../../etc", "1.0.0", "id")).toThrow("disallowed characters");
    });

    test("should throw for path traversal in bundle id", () => {
        expect(() => safeBundlePath(storagePath, "myapp", "1.0.0", "../../../etc")).toThrow("disallowed characters");
    });

    test("should throw for slashes in segments", () => {
        expect(() => safeBundlePath(storagePath, "my/app", "1.0.0", "id")).toThrow("disallowed characters");
    });

    test("should throw for spaces in segments", () => {
        expect(() => safeBundlePath(storagePath, "my app", "1.0.0", "id")).toThrow("disallowed characters");
    });

    test("should throw for dot-dot segment", () => {
        expect(() => safeBundlePath(storagePath, "myapp", "..", "id")).toThrow("disallowed characters");
    });

    test("should throw for single dot segment", () => {
        expect(() => safeBundlePath(storagePath, ".", "1.0.0", "id")).toThrow("disallowed characters");
    });
});
