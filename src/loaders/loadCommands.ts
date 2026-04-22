import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SlashCommand } from "../types/command.js";
import { BotClient } from "../index.js";

export async function loadCommands(client: BotClient) {
	const currentFilePath = fileURLToPath(import.meta.url);
	const currentDirPath = path.dirname(currentFilePath);
	const foldersPath = path.join(currentDirPath, "../commands");

	const folderEntries = fs.readdirSync(foldersPath);

	for (const entry of folderEntries) {
		const commandFolderPath = path.join(foldersPath, entry);
		// .js because the .ts files get translated to .js
		const commandFiles = fs
			.readdirSync(commandFolderPath)
			.filter((file) => file.endsWith(".js"));

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
