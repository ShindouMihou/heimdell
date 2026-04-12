import {describe, test, expect, mock} from "bun:test";

mock.module("hono/bun", () => ({
    getConnInfo: () => ({ remote: { address: "127.0.0.1" } }),
}));

import {extractDeviceInfo} from "./extractDeviceInfo";

function mockContext(headers: Record<string, string> = {}) {
    return {
        req: {
            header: (name: string) => headers[name.toLowerCase()],
        },
    } as any;
}

describe("extractDeviceInfo", () => {
    test("should extract all headers when present", () => {
        const c = mockContext({
            "x-device-id": "device-123",
            "x-device-os": "Android 14",
            "user-agent": "MyApp/1.0",
            "cf-connecting-ip": "1.2.3.4",
        });

        const info = extractDeviceInfo(c);
        expect(info.device_id).toBe("device-123");
        expect(info.device_os).toBe("Android 14");
        expect(info.user_agent).toBe("MyApp/1.0");
        expect(info.ip_address).toBe("1.2.3.4");
    });

    test("should return null for missing headers", () => {
        const c = mockContext({});
        const info = extractDeviceInfo(c);
        expect(info.device_id).toBeNull();
        expect(info.device_os).toBeNull();
        expect(info.user_agent).toBeNull();
    });

    test("should truncate oversized device_id to 128 chars", () => {
        const c = mockContext({
            "x-device-id": "a".repeat(200),
        });
        const info = extractDeviceInfo(c);
        expect(info.device_id!.length).toBe(128);
    });

    test("should truncate oversized device_os to 64 chars", () => {
        const c = mockContext({
            "x-device-os": "b".repeat(100),
        });
        const info = extractDeviceInfo(c);
        expect(info.device_os!.length).toBe(64);
    });

    test("should truncate oversized user_agent to 256 chars", () => {
        const c = mockContext({
            "user-agent": "c".repeat(500),
        });
        const info = extractDeviceInfo(c);
        expect(info.user_agent!.length).toBe(256);
    });

    test("should strip control characters from headers", () => {
        const c = mockContext({
            "x-device-id": "device\r\n-injected",
            "x-device-os": "OS\x00\x1fversion",
            "user-agent": "Agent\nNewline",
        });
        const info = extractDeviceInfo(c);
        expect(info.device_id).toBe("device-injected");
        expect(info.device_os).toBe("OSversion");
        expect(info.user_agent).toBe("AgentNewline");
    });

    test("should fall back through IP header chain", () => {
        const c1 = mockContext({ "x-forwarded-for": "10.0.0.1" });
        expect(extractDeviceInfo(c1).ip_address).toBe("10.0.0.1");

        const c2 = mockContext({ "remote-addr": "192.168.1.1" });
        expect(extractDeviceInfo(c2).ip_address).toBe("192.168.1.1");
    });
});
