import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

const queueCommand = {
	data: new SlashCommandBuilder()
		.setName("queue")
		.setDescription("Start a session"),
		async execute(interaction: ChatInputCommandInteraction) {
			const user = interaction.user;
			const timeObject = new Date();
			const timeStarted = Math.floor(timeObject.getTime() / 1000); // Milli to Seconds

			await interaction.reply(`${user} started a chudstack at <t:${timeStarted}>`);

			// TODO:
			// Track start and end time
			// Ping role? 
			// Bot joins VC?
			// Detect people in VC?
		}
};

export default queueCommand;
