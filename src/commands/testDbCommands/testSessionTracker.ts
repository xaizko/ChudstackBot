import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { db } from "../../loaders/loadDb.js";

const getChudstackSession = db.prepare(`
	SELECT id, guild_id, channel_id, start_time, end_time, duration_seconds
	FROM chudstack_sessions
	WHERE id = ?
`);

const testSessionTrackerCommand = {
	data: new SlashCommandBuilder()
		.setName("testsessiontracker")
		.setDescription("Check a chudstack session by id")
		.addIntegerOption((option) =>
			option
				.setName("id")
				.setDescription("The session id to inspect")
				.setRequired(true),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const sessionId = interaction.options.getInteger("id", true);
		const session = getChudstackSession.get(sessionId) as
			| {
				id: number;
				guild_id: string;
				channel_id: string;
				start_time: number;
				end_time: number | null;
				duration_seconds: number | null;
			}
			| undefined;

		if (!session) {
			await interaction.reply(`No chudstack session found for id ${sessionId}.`);
			return;
		}

		const startTime = `<t:${session.start_time}>`;
		const endTime = session.end_time ? `<t:${session.end_time}>` : "still running";
		const duration = session.duration_seconds === null ? "still running" : `${session.duration_seconds}s`;

		await interaction.reply([
			`Session #${session.id}`,
			`Guild: ${session.guild_id}`,
			`Channel: ${session.channel_id}`,
			`Start: ${startTime}`,
			`End: ${endTime}`,
			`Duration: ${duration}`,
		].join("\n"));
	},
};

export default testSessionTrackerCommand;
