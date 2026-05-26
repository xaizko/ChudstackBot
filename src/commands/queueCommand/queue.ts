import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from "discord.js";

const queueCommand = {
	data: new SlashCommandBuilder()
		.setName("queue")
		.setDescription("Start a session")
		.addChannelOption(option => option
				   .setName("channel")
				   .setDescription("Channel to join")
				   .setRequired(true)
				   .addChannelTypes(ChannelType.GuildVoice)),
		async execute(interaction: ChatInputCommandInteraction) {
			const user = interaction.user;
			const timeObject = new Date();
			const timeStarted = Math.floor(timeObject.getTime() / 1000); // Milli to Seconds

			await interaction.reply(`${user} started a chudstack at <t:${timeStarted}> in ${interaction.options.getChannel("channel")}`);

			// TODO:
			// Track start and end time
			// Ping role? 
			// Bot joins VC?
			// Detect people in VC?
		}
};

export default queueCommand;
