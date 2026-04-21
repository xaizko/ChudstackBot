import {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
	REST,
	Routes,
	SlashCommandBuilder,
	type ChatInputCommandInteraction
} from "discord.js";
import reminderCommand from "./commands/reminderCommand/reminder.js";
import 'dotenv/config';

type SlashCommand = {
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

// Set to store commands
const commands = new Collection<string, SlashCommand>();
commands.set(reminderCommand.data.name, reminderCommand);

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN ?? "");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel, Partials.Message]
});

client.once("clientReady", async () => {
	if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
		console.warn("Missing BOT_TOKEN or CLIENT_ID or GUIL_ID in environment; slash command registration skipped.");
		return;
	}

	try {
		const payload = [...commands.values()].map((command) => command.data.toJSON());

		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: payload }
		);

		console.log("Command registration complete.");
	} catch (error) {
		console.error("Failed to register slash commands:", error);
	}
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(`Error executing command ${interaction.commandName}:`, error);
	}
});

client.login(process.env.BOT_TOKEN);
