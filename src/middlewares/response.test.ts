import { describe, test, expect, mock } from "bun:test";
import { respondInvalidRequest, respondForbidden, respondError } from "./response";
import { Context } from "hono";

describe("response middleware", () => {
    test("respondInvalidRequest should return 400 with Invalid Request message", () => {
        const mockContext = {
            status: mock(() => {}),
            json: mock(() => ({ error: "Invalid Request" }))
        } as unknown as Context;

        const result = respondInvalidRequest(mockContext);
        
        expect(mockContext.status).toHaveBeenCalledWith(400);
        expect(mockContext.json).toHaveBeenCalledWith({ error: "Invalid Request" });
        expect(result).toEqual({ error: "Invalid Request" });
    });

    test("respondForbidden should return 403 with authentication error", () => {
        const mockContext = {
            status: mock(() => {}),
            json: mock(() => ({ error: "Invalid authentication." }))
        } as unknown as Context;

        const result = respondForbidden(mockContext);
        
        expect(mockContext.status).toHaveBeenCalledWith(403);
        expect(mockContext.json).toHaveBeenCalledWith({ error: "Invalid authentication." });
        expect(result).toEqual({ error: "Invalid authentication." });
    });

    test("respondError should set custom status and error message", () => {
        const mockContext = {
            status: mock(() => {}),
            json: mock(() => ({ error: "Custom error" }))
        } as unknown as Context;

        const result = respondError(mockContext, 500, "Custom error");
        
        expect(mockContext.status).toHaveBeenCalledWith(500);
        expect(mockContext.json).toHaveBeenCalledWith({ error: "Custom error" });
        expect(result).toEqual({ error: "Custom error" });
    });
});