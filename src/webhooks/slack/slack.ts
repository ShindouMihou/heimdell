import {Config} from "../../config/type";
import {Bundle} from "../../models/bundle";

type MessageBuilder = {
    setText: (value: string) => MessageBuilder;
    custom: (block: any) => MessageBuilder;
    divider: () => MessageBuilder;
    table: (rows: ({ text: string, style: any }|string)[][]) => MessageBuilder;
    mrkdwn: (text: string) => MessageBuilder;
    build: () => string;
};

const createMessageBuilder = () => {
    let text = '';
    const blocks = [] as any[];

    let messageBuilder: MessageBuilder;
    messageBuilder = {
        setText: (value: string) => {
            text = value;
            return messageBuilder;
        },
        custom: (block: any) => {
            blocks.push(block);
            return messageBuilder;
        },
        divider: () => {
            blocks.push({ type: 'divider' });
            return messageBuilder;
        },
        table: (rows: ({ text: string, style: any }|string)[][]) => {
            blocks.push({
                type: 'table',
                rows: rows.map(innerRow => innerRow.map(row =>
                    ({
                        "type": "rich_text",
                        "elements": [
                            {
                                "type": "rich_text_section",
                                "elements": [
                                    {
                                        "type": "text",
                                        "text": typeof row === 'string' ? row : row.text,
                                        "style": typeof row === 'string' ? {
                                            "bold": true
                                        } : row.style
                                    }
                                ]
                            }
                        ]
                    }))
                )
            });
            return messageBuilder;
        },
        mrkdwn: (text: string) => {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text,
                },
            });
            return messageBuilder;
        },
        build: () => {
            return JSON.stringify({
                text,
                blocks: blocks,
            });
        }
    }
    return messageBuilder;
};

/**
 * Creates a minimal Slack webhook channel handler.
 * @param webhook
 */
export const createSlackChannel = (webhook: string) => {
    type OmittedMessageBuilder = Omit<MessageBuilder, "build">;
    const sendMessage = async (messageBuilder: ((messageBuilder: OmittedMessageBuilder) => OmittedMessageBuilder)) => {
        const builder = messageBuilder(createMessageBuilder()) as MessageBuilder;
        const body = builder.build();
        await fetch(webhook, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });
    };
    return {sendMessage};
}

export const useDefaultSlackChannelHooks = (channel: ReturnType<typeof createSlackChannel>) => {
    const normalizeTag = (tag: string) => {
        return tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const bundleToTable = (bundle: Bundle) => {
        return [
            [
                {
                    text: "Property",
                    style: {
                        bold: true
                    }
                },
                {
                    text: "Value",
                    style: {
                        bold: true
                    }
                }
            ],
            ["Bundle ID", bundle.id],
            ["Version", bundle.version.toString()],
            ["Tag", normalizeTag(bundle.tag)],
            ["Author", bundle.author || "Unknown"],
            ["Created At", new Date(bundle.created_at).toLocaleString()],
            ["Notes", bundle.note || "N/A"],
        ];
    };

    return {
        onBundlePush: async (bundle: Bundle, environment: string) => channel.sendMessage((builder) => {
            return builder
                .mrkdwn(
                    ":warning: *New Bundle Pushed*\n" +
                    `*${bundle.author}* has pushed a new bundle to the *${normalizeTag(bundle.tag)}* tag in the *${environment}* environment.`
                )
                .divider()
                .table(bundleToTable(bundle))
        }),
        onBundleReserve: async (bundle: Bundle, environment: string) => channel.sendMessage((builder) => {
            return builder
                .mrkdwn(
                    ":information_source: *Bundle Reserved*\n" +
                    `*${bundle.author}* has reserved a new bundle for the *${normalizeTag(bundle.tag)}* tag in the *${environment}* environment.`
                )
                .divider()
                .table(bundleToTable(bundle))
        }),
        onBundleDispose: async (bundle: Bundle, environment: string) => {
            return channel.sendMessage((builder) => {
                return builder
                    .mrkdwn(
                        ":wastebasket: *Bundle Disposed*\n" +
                        `*${bundle.author}* has disposed a bundle for the *${normalizeTag(bundle.tag)}* tag in the *${environment}* environment.`
                    )
                    .divider()
                    .table(bundleToTable(bundle))
            })
        },
        onBundleRollback: async (bundle: Bundle, environment: string) => {
            return channel.sendMessage((builder) => {
                return builder
                    .mrkdwn(
                        ":leftwards_arrow_with_hook: *Bundle Rolled Back*\n" +
                        `*${bundle.author}* has rolled back to a bundle for the *${normalizeTag(bundle.tag)}* tag in the *${environment}* environment.`
                    )
                    .divider()
                    .table(bundleToTable(bundle))
            })
        }
    } as Partial<Config>;
}