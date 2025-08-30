import { describe, test, expect } from "bun:test";
import { Hashed, hashed } from "./hashed";

describe("Hashed", () => {
    test("should throw error for non-argon2id hash", () => {
        expect(() => new Hashed("invalid-hash")).toThrow("Unsupported hashing algorithm. Please use argon2id for your hashed passwords.");
    });

    test("should accept valid argon2id hash", () => {
        const validHash = "$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQ$hash";
        expect(() => new Hashed(validHash)).not.toThrow();
    });

    test("should verify correct password", async () => {
        const password = "testpassword";
        const hash = await Bun.password.hash(password);
        const hashedPassword = new Hashed(hash);
        
        const isValid = await hashedPassword.verify(password);
        expect(isValid).toBe(true);
    });

    test("should reject incorrect password", async () => {
        const password = "testpassword";
        const wrongPassword = "wrongpassword";
        const hash = await Bun.password.hash(password);
        const hashedPassword = new Hashed(hash);
        
        const isValid = await hashedPassword.verify(wrongPassword);
        expect(isValid).toBe(false);
    });
});

describe("hashed factory function", () => {
    test("should create Hashed instance", () => {
        const validHash = "$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQ$hash";
        const hashedPassword = hashed(validHash);
        expect(hashedPassword).toBeInstanceOf(Hashed);
        expect(hashedPassword.hash).toBe(validHash);
    });
});