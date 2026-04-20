import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { CHUD_REMINDERS } from "../../data/ChudReminders.js";

const reminderCommand = {
	data: new SlashCommandBuilder()
		.setName('reminder')
		.setDescription("Replies with a chud reminder"),
		async execute(interaction: ChatInputCommandInteraction) {
			const randomIndex = Math.floor(Math.random() * CHUD_REMINDERS.length);
			const reminder = CHUD_REMINDERS[randomIndex] as string;
			await interaction.reply(reminder)
		}
};

export default reminderCommand;
