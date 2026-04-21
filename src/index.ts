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
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import 'dotenv/config';

type SlashCommand = {
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

type BotClient = Client & {
	commands: Collection<string, SlashCommand>;
};

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN ?? "");

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
client.commands = new Collection<string, SlashCommand>();

async function loadCommands() {
	const currentFilePath = fileURLToPath(import.meta.url);
	const currentDirPath = path.dirname(currentFilePath);
	const foldersPath = path.join(currentDirPath, "commands");

	const folderEntries = fs.readdirSync(foldersPath);

	for (const entry of folderEntries) {
		const commandFolderPath = path.join(foldersPath, entry);
		const commandFiles = (fs.readdirSync(commandFolderPath)).filter((file) => file.endsWith(".js"));

		for (const file of commandFiles) {
			const filePath = path.join(commandFolderPath, file);
			const commandModule = await import(pathToFileURL(filePath).href);
			const command = (commandModule.default ?? commandModule) as Partial<SlashCommand>;

			if (command.data && command.execute) {
				client.commands.set(command.data.name, command as SlashCommand);
			} else {
				console.warn(`[WARNING] Command at ${filePath} is missing required data/execute exports.`);
			}
		}
	}
}

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

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(`Error executing command ${interaction.commandName}:`, error);
	}
});

function loadBot() {
	client.login(process.env.BOT_TOKEN);
	loadCommands();
}

loadBot();
