import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { BotClient } from "../index.js";
import type { BotEvent } from "../types/event.js";

export async function loadEvents(client: BotClient) {
	const currentFilePath = fileURLToPath(import.meta.url);
	const currentDirPath = path.dirname(currentFilePath);
	const eventsPath = path.join(currentDirPath, "../events");


	// .js because the .ts files get translated to .js
	const eventFiles = fs
		.readdirSync(eventsPath)
		.filter((file) => file.endsWith(".js"));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const eventModule = await import(pathToFileURL(filePath).href);
		const event = (eventModule.default ?? eventModule) as Partial<BotEvent>;

		if (!event.name || !event.execute) {
			console.warn(`[WARNING] Event at ${filePath} is missing required name/execute exports.`);
			continue;
		}

		if (event.once) {
			client.once(event.name, (...args) => event.execute!(...args));
		} else {
			client.on(event.name, (...args) => event.execute!(...args));
		}
	}
}
