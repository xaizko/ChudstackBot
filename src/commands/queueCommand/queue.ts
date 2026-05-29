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
} from "@discordjs/voice";
import { startChudstackSession } from "../../features/chudstackSession.js";

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
			const timeStarted = Math.floor(Date.now() / 1000);

			if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
				// Opens voice connection and starts session
				joinVoiceChannel({
					channelId: voiceChannel.id,
					guildId: interaction.guildId!,
					adapterCreator: interaction.guild!.voiceAdapterCreator,
				})
				startChudstackSession(interaction.guildId!, voiceChannel.id, timeStarted);
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
