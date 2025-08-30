import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Bundle, CreateBundleParams, CreateBundleParamsSchema } from "./bundle";

describe("Bundle", () => {
    describe("generateId", () => {
        test("should generate ID with version, sanitized tag, and random string", () => {
            const version = "1.0.0";
            const tag = "Production Release";
            const id = Bundle.generateId(version, tag);
            
            expect(id).toMatch(/^1\.0\.0-production_release-[A-Za-z0-9]{8}$/);
        });

        test("should sanitize tag with spaces and special characters", () => {
            const version = "2.1.0";
            const tag = "Beta Test Environment";
            const id = Bundle.generateId(version, tag);
            
            expect(id).toContain("beta_test_environment");
        });
    });

    describe("create", () => {
        test("should create new Bundle instance with generated ID", () => {
            const params: CreateBundleParams = {
                version: "1.0.0",
                tag: "production",
                note: "Initial release",
                author: "testuser"
            };

            const bundle = Bundle.create(params);
            
            expect(bundle.version).toBe("1.0.0");
            expect(bundle.tag).toBe("production");
            expect(bundle.note).toBe("Initial release");
            expect(bundle.author).toBe("testuser");
            expect(bundle.is_disposed).toBe(false);
            expect(bundle.id).toMatch(/^1\.0\.0-production-[A-Za-z0-9]{8}$/);
            expect(bundle.created_at).toBeInstanceOf(Date);
        });
    });

    describe("from", () => {
        test("should create Bundle from database data", () => {
            const data = {
                id: "1.0.0-production-abc12345",
                version: "1.0.0",
                tag: "production",
                note: "Test bundle",
                author: "testuser",
                is_disposed: false,
                created_at: "2024-01-01T00:00:00.000Z"
            };

            const bundle = Bundle.from(data);
            
            expect(bundle.id).toBe(data.id);
            expect(bundle.version).toBe(data.version);
            expect(bundle.tag).toBe(data.tag);
            expect(bundle.note).toBe(data.note);
            expect(bundle.author).toBe(data.author);
            expect(bundle.is_disposed).toBe(data.is_disposed);
            expect(bundle.created_at).toEqual(new Date(data.created_at));
        });
    });

    describe("instance methods", () => {
        let bundle: Bundle;

        beforeEach(() => {
            bundle = Bundle.create({
                version: "1.0.0",
                tag: "test",
                note: "Test bundle",
                author: "testuser"
            });
        });

        test("dispose should mark bundle as disposed", () => {
            expect(bundle.is_disposed).toBe(false);
            
            // Mock the database operation
            const mockQuery = mock(() => ({ run: mock(() => {}) }));
            mock.module("../db/db", () => ({ db: { query: mockQuery } }));
            
            bundle.dispose();
            
            expect(bundle.is_disposed).toBe(true);
        });

        test("recover should mark disposed bundle as not disposed", () => {
            bundle.is_disposed = true;
            
            const mockQuery = mock(() => ({ run: mock(() => {}) }));
            mock.module("../db/db", () => ({ db: { query: mockQuery } }));
            
            bundle.recover();
            
            expect(bundle.is_disposed).toBe(false);
        });

        test("dispose should not change already disposed bundle", () => {
            bundle.is_disposed = true;
            const mockQuery = mock(() => ({ run: mock(() => {}) }));
            mock.module("../db/db", () => ({ db: { query: mockQuery } }));
            
            bundle.dispose();
            
            expect(mockQuery).not.toHaveBeenCalled();
        });

        test("recover should not change already active bundle", () => {
            bundle.is_disposed = false;
            const mockQuery = mock(() => ({ run: mock(() => {}) }));
            mock.module("../db/db", () => ({ db: { query: mockQuery } }));
            
            bundle.recover();
            
            expect(mockQuery).not.toHaveBeenCalled();
        });
    });
});

describe("CreateBundleParamsSchema", () => {
    test("should validate correct bundle params", () => {
        const validParams = {
            version: "1.0.0",
            tag: "production",
            note: "Valid bundle"
        };

        const result = CreateBundleParamsSchema.safeParse(validParams);
        expect(result.success).toBe(true);
    });

    test("should reject empty version", () => {
        const invalidParams = {
            version: "",
            tag: "production",
            note: "Invalid bundle"
        };

        const result = CreateBundleParamsSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
    });

    test("should reject version longer than 20 characters", () => {
        const invalidParams = {
            version: "1.0.0-very-long-version-string",
            tag: "production",
            note: "Invalid bundle"
        };

        const result = CreateBundleParamsSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
    });

    test("should reject tag longer than 256 characters", () => {
        const invalidParams = {
            version: "1.0.0",
            tag: "a".repeat(257),
            note: "Invalid bundle"
        };

        const result = CreateBundleParamsSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
    });

    test("should reject note longer than 512 characters", () => {
        const invalidParams = {
            version: "1.0.0",
            tag: "production",
            note: "a".repeat(513)
        };

        const result = CreateBundleParamsSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
    });
});