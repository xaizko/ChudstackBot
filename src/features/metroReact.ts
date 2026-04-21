import type { Message } from "discord.js";

export async function metroReact(message: Message) {
    if (message.author.bot) return;
    
    if (message.content.toLowerCase().includes("metro")) {
        await message.react("1495344198151311502");
    }
}