export type BotEvent = {
    name: string;
    once?: boolean;
    execute: (...args: unknown[]) => Promise<void> | void;
};

export type BotEventModule = {
    default: BotEvent;
};
