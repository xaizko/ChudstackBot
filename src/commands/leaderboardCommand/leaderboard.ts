import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { buildTimeLeaderboardPage } from "../../features/leaderboard.js";

const leaderboardCommand = {
	data: new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("Show leaderboard rankings")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("time")
				.setDescription("Show leaderboard by vc time"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("wins")
				.setDescription("Show leaderboard by wins"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("loses")
				.setDescription("Show leaderboard by loses"),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === "time") {
			const leaderboardPage = buildTimeLeaderboardPage(1);
			await interaction.reply({
				content: leaderboardPage.content,
				components: leaderboardPage.components,
			});
			return;
		}

		await interaction.reply({
			content: `The ${subcommand} leaderboard is not implemented yet.`,
			ephemeral: true,
		});
	},
};

export default leaderboardCommand;