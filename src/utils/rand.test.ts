import { describe, test, expect } from "bun:test";
import { randomString } from "./rand";

describe("randomString", () => {
    test("should generate string of correct length", () => {
        const length = 10;
        const result = randomString(length);
        expect(result).toHaveLength(length);
    });

    test("should generate different strings on multiple calls", () => {
        const result1 = randomString(20);
        const result2 = randomString(20);
        expect(result1).not.toBe(result2);
    });

    test("should only contain valid characters", () => {
        const result = randomString(100);
        const validChars = /^[A-Za-z0-9]+$/;
        expect(validChars.test(result)).toBe(true);
    });

    test("should handle zero length", () => {
        const result = randomString(0);
        expect(result).toBe("");
    });

    test("should handle single character length", () => {
        const result = randomString(1);
        expect(result).toHaveLength(1);
        expect(/^[A-Za-z0-9]$/.test(result)).toBe(true);
    });
});