import {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
	REST,
	Routes,
} from "discord.js";
import 'dotenv/config';
import { loadCommands } from "./loaders/loadCommands.js";
import { loadDb } from "./loaders/loadDb.js"
import { loadEvents } from "./loaders/loadEvents.js";
import { SlashCommand } from "./types/command.js";

export type BotClient = Client & {
	commands: Collection<string, SlashCommand>;
};

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN ?? "");

async function main() {
    const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent
		],
		partials: [Partials.Channel, Partials.Message]
	}) as BotClient;

	// Collection to store commands
	client.commands = new Collection();

	await loadCommands(client);
	await loadEvents(client);
	await loadDb();

	// Command registration
    client.once("clientReady", async () => {
		if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
			console.warn("Missing BOT_TOKEN or CLIENT_ID or GUILD_ID in environment; slash command registration skipped.");
			return;
		}

		try {
			const payload = [...client.commands.values()].map((command) => command.data.toJSON());

			await rest.put(
				Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
				{ body: payload }
			);

			console.log("Command registration complete.");
		} catch (error) {
			console.error("Failed to register slash commands:", error);
		}
	});

    await client.login(process.env.BOT_TOKEN);
}

main().catch((error) => {
	console.error("Fatal startup error:", error);
});
