import { describe, test, expect } from "bun:test";
import { Hashed } from "../config/ext/hashed";

describe("Hashed class integration", () => {
    test("should verify password using actual Bun.password", async () => {
        const password = "testpassword";
        const hash = await Bun.password.hash(password);
        const hashedPassword = new Hashed(hash);
        
        const isValid = await hashedPassword.verify(password);
        expect(isValid).toBe(true);
    });

    test("should reject incorrect password using actual Bun.password", async () => {
        const password = "testpassword";
        const wrongPassword = "wrongpassword";
        const hash = await Bun.password.hash(password);
        const hashedPassword = new Hashed(hash);
        
        const isValid = await hashedPassword.verify(wrongPassword);
        expect(isValid).toBe(false);
    });
});