import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getSteam32Id } from "../../utility/getSteamId.js";

const registerCommand = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription("Register your steam account to help keep track during sessions")
		.addStringOption(option => 
				option.setName("steamid")
					.setDescription("Please enter your steam ID, go to your profile and extract it from the URL")
					.setRequired(true)
				),
		async execute(interaction: ChatInputCommandInteraction) {
			const steamId64 = interaction.options.getString("steamid", true).trim();

			if (!/^\d{17}$/.test(steamId64)) {
				await interaction.reply("Please enter a SteamID64");
				return;
			}
			const steam32Id = await getSteam32Id(BigInt(steamId64));

			await interaction.reply(`Your Steam32Id is ${steam32Id}`);
		}
};

export default registerCommand;
