import { Events, type Message } from "discord.js";
import { metroReact } from "../features/metroReact.js";
import type { BotEvent } from "../types/event.js";

const messageCreate: BotEvent = {
    name: Events.MessageCreate,
    async execute(message) {
        await metroReact(message as Message);
    }
};

export default messageCreate;