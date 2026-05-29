import { 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	ChatInputCommandInteraction, 
	ChannelType, 
	MessageActionRowComponentBuilder ,
	SlashCommandBuilder,
	VoiceChannel,
} from "discord.js";
import { 
	joinVoiceChannel, 
	VoiceConnectionStatus,
} from "@discordjs/voice";

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
			const voiceChannel = interaction.options.getChannel("channel") as VoiceChannel;
			const timeObject = new Date();
			const timeStarted = Math.floor(timeObject.getTime() / 1000); // Milli to Seconds

			// Join VC
			if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
				const connection = joinVoiceChannel({
					channelId: voiceChannel.id,
					guildId: interaction.guildId!,
					adapterCreator: interaction.guild!.voiceAdapterCreator,
				})

				if (voiceChannel.members.size <= 1) {
					const LOCKOUT_TIMER = 5 * 60 * 1000;

					// Disconnects if no one joins initially
					setTimeout(() => {
						if (voiceChannel.members.size <= 1) {
							if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
								connection.destroy();

								interaction.reply({
									content: `Chudstack was closed because no one joined ${voiceChannel} in 5 minutes`,
									ephemeral: false
								});
							}
						}
					}, LOCKOUT_TIMER);
				}
			}

			// Button to join VC
			const joinButton = new ButtonBuilder()
						.setCustomId("join")
						.setLabel("Join Chudstack")
						.setStyle(ButtonStyle.Success);
			const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(joinButton);

			// Reply Message
			await interaction.reply({
				content: `${user} started a chudstack at <t:${timeStarted}> in ${voiceChannel}`,
				components: [row],
			});
		},
};

export default queueCommand;
