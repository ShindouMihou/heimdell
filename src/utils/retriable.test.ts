import { describe, test, expect, mock } from "bun:test";
import { retriable, DelayStrategies } from "./retriable";

describe("retriable", () => {
    test("should succeed on first attempt", async () => {
        const mockFn = mock(() => Promise.resolve("success"));
        const retriableFn = retriable(mockFn, 3);

        const result = await retriableFn();
        
        expect(result).toBe("success");
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("should retry on failure and eventually succeed", async () => {
        let attempts = 0;
        const mockFn = mock(() => {
            attempts++;
            if (attempts < 3) {
                return Promise.reject(new Error("failure"));
            }
            return Promise.resolve("success");
        });
        
        const retriableFn = retriable(mockFn, 3, DelayStrategies.constant);

        const result = await retriableFn();
        
        expect(result).toBe("success");
        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test("should throw error after max retries", async () => {
        const mockFn = mock(() => Promise.reject(new Error("persistent failure")));
        const retriableFn = retriable(mockFn, 2, DelayStrategies.constant);

        await expect(retriableFn()).rejects.toThrow("persistent failure");
        expect(mockFn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    test("should pass arguments correctly", async () => {
        const mockFn = mock((a: string, b: number) => Promise.resolve(`${a}-${b}`));
        const retriableFn = retriable(mockFn, 1);

        const result = await retriableFn("test", 42);
        
        expect(result).toBe("test-42");
        expect(mockFn).toHaveBeenCalledWith("test", 42);
    });
});

describe("DelayStrategies", () => {
    test("linear strategy should increase linearly", () => {
        expect(DelayStrategies.linear(1)).toBe(1000);
        expect(DelayStrategies.linear(2)).toBe(2000);
        expect(DelayStrategies.linear(3)).toBe(3000);
    });

    test("exponential strategy should increase exponentially", () => {
        expect(DelayStrategies.exponential(1)).toBe(2000);
        expect(DelayStrategies.exponential(2)).toBe(4000);
        expect(DelayStrategies.exponential(3)).toBe(8000);
    });

    test("constant strategy should return same value", () => {
        expect(DelayStrategies.constant(1)).toBe(1000);
        expect(DelayStrategies.constant(5)).toBe(1000);
        expect(DelayStrategies.constant(10)).toBe(1000);
    });
});