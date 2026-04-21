import { Events, type ChatInputCommandInteraction } from "discord.js";
import type { BotEvent } from "../types/event.js";
import type { BotClient } from "../index.js";

const interactionCreate: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const typedInteraction = interaction as ChatInputCommandInteraction;
        if (!typedInteraction.isChatInputCommand()) return;

        const client = typedInteraction.client as BotClient;
        const command = client.commands.get(typedInteraction.commandName);
        if (!command) return;

        try {
            await command.execute(typedInteraction);
        } catch (error) {
            console.error(`Error executing command ${typedInteraction.commandName}:`, error);
            if (typedInteraction.replied || typedInteraction.deferred) {
                await typedInteraction.followUp({ content: "Command failed.", ephemeral: true });
            } else {
                await typedInteraction.reply({ content: "Command failed.", ephemeral: true });
            }
        }
    }
};

export default interactionCreate;