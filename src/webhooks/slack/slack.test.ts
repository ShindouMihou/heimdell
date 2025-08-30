import { describe, test, expect, mock, beforeEach } from "bun:test";
import { createSlackChannel, useDefaultSlackChannelHooks } from "./slack";
import { Bundle } from "../../models/bundle";

describe("createSlackChannel", () => {
    test("should create channel with sendMessage function", () => {
        const webhook = "https://hooks.slack.com/test";
        const channel = createSlackChannel(webhook);
        
        expect(channel.sendMessage).toBeFunction();
    });

    test("should send message to webhook URL", async () => {
        const webhook = "https://hooks.slack.com/test";
        const mockFetch = mock(() => Promise.resolve(new Response()));
        global.fetch = mockFetch;
        
        const channel = createSlackChannel(webhook);
        await channel.sendMessage(builder => builder.setText("Test message"));
        
        expect(mockFetch).toHaveBeenCalledWith(
            webhook,
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.any(String)
            })
        );
    });
});

describe("useDefaultSlackChannelHooks", () => {
    let mockChannel: ReturnType<typeof createSlackChannel>;
    let bundle: Bundle;

    beforeEach(() => {
        mockChannel = {
            sendMessage: mock(() => Promise.resolve())
        };
        
        bundle = Bundle.create({
            version: "1.0.0",
            tag: "production",
            note: "Test bundle",
            author: "test-user"
        });
    });

    test("onBundlePush should send push notification", async () => {
        const hooks = useDefaultSlackChannelHooks(mockChannel);
        
        await hooks.onBundlePush!(bundle, "production");
        
        expect(mockChannel.sendMessage).toHaveBeenCalledTimes(1);
        expect(mockChannel.sendMessage).toHaveBeenCalledWith(expect.any(Function));
    });

    test("onBundleReserve should send reserve notification", async () => {
        const hooks = useDefaultSlackChannelHooks(mockChannel);
        
        await hooks.onBundleReserve!(bundle, "staging");
        
        expect(mockChannel.sendMessage).toHaveBeenCalledTimes(1);
        expect(mockChannel.sendMessage).toHaveBeenCalledWith(expect.any(Function));
    });

    test("onBundleDispose should send dispose notification", async () => {
        const hooks = useDefaultSlackChannelHooks(mockChannel);
        
        await hooks.onBundleDispose!(bundle, "production");
        
        expect(mockChannel.sendMessage).toHaveBeenCalledTimes(1);
        expect(mockChannel.sendMessage).toHaveBeenCalledWith(expect.any(Function));
    });

    test("onBundleRollback should send rollback notification", async () => {
        const hooks = useDefaultSlackChannelHooks(mockChannel);
        
        await hooks.onBundleRollback!(bundle, "production");
        
        expect(mockChannel.sendMessage).toHaveBeenCalledTimes(1);
        expect(mockChannel.sendMessage).toHaveBeenCalledWith(expect.any(Function));
    });
});