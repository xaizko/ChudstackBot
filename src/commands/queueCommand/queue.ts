import { ButtonBuilder, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, ButtonStyle, ActionRowBuilder, MessageActionRowComponentBuilder } from "discord.js";

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

			const joinButton = new ButtonBuilder()
						.setCustomId("join")
						.setLabel("Join Chudstack")
						.setStyle(ButtonStyle.Success);
			const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(joinButton);

			await interaction.reply({
				content: `${user} started a chudstack at <t:${timeStarted}> in ${interaction.options.getChannel("channel")}`,
				components: [row],
			});

			// TODO:
			// Track start and end time
			// Ping role? 
			// Bot joins VC?
			// Detect people in VC?
		},
};

export default queueCommand;
