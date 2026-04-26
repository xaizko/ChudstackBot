import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getSteam32Id } from "../../utility/getSteam32Id.js";
import { db } from "../../loaders/loadDb.js";

const ensureUser = db.prepare(`
			      INSERT INTO users (discord_id) VALUES (?)
			      ON CONFLICT(discord_id) DO NOTHING
			      `);

const ensureStats = db.prepare(`
			       INSERT INTO stats (discord_id) VALUES (?)
			       ON CONFLICT(discord_id) DO NOTHING
			       `);

const ensureSteamProfile = db.prepare(`
				      INSERT INTO profile_links (discord_id, steam_id) VALUES (?, ?)
				      ON CONFLICT(discord_id) DO UPDATE SET steam_id = excluded.steam_id
				      `)

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
			const steam64Id = interaction.options.getString("steamid", true).trim();

			if (!/^\d{17}$/.test(steam64Id)) {
				await interaction.reply("Please enter a SteamID64");
				return;
			}
			const steam32Id = await getSteam32Id(BigInt(steam64Id));

			const user = interaction.user;
			const discordId = user.id;
			
			const tx = db.transaction(() => {
				ensureUser.run(discordId);
				ensureStats.run(discordId);
				ensureSteamProfile.run(discordId, steam32Id);
			});
			tx();

			await interaction.reply(`Successfully added ${user} to database`);
		}
};

export default registerCommand;
