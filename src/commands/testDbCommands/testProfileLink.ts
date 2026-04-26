import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { db } from "../../loaders/loadDb.js";


const getProfile = db.prepare(`
						 SELECT steam_id
						 FROM profile_links
						 WHERE discord_id = ?
					 `);

const testProfileLinkCommand = {
	data: new SlashCommandBuilder()
		.setName("testprofilelink")
		.setDescription("Test the DB by getting linked steam id for a user"),
		async execute(interaction: ChatInputCommandInteraction) {
			const user = interaction.user;
			const discordId = user.id;

			const row = getProfile.get(discordId) as { steam_id: string | null } | undefined;
			if (!row?.steam_id) {
				await interaction.reply(`${user} has no linked Steam32Id.`);
				return;
			}

			await interaction.reply(`${user} -> Steam32Id: ${row.steam_id}`);
		}
};

export default testProfileLinkCommand;
