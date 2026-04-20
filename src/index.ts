import { Client, GatewayIntentBits, Partials } from "discord.js";
import { CHUD_REMINDERS } from "./data/ChudReminders.js";
import 'dotenv/config';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel, Partials.Message]
});

client.on("messageCreate", (message) => {
	if (message.author.bot) return;
	if (!client.user) return;

	if (message.mentions.has(client.user)) {
		const randomIndex = Math.floor(Math.random() * CHUD_REMINDERS.length);
		const reminder = CHUD_REMINDERS[randomIndex] as string;
		message.channel.send(reminder);
	}
});

client.login(process.env.BOT_TOKEN);
