import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { db } from "../../loaders/loadDb.js";

const getChudstackSession = db.prepare(`
	SELECT id, guild_id, channel_id, start_time, end_time, duration_seconds
	FROM chudstack_sessions
	WHERE id = ?
`);

const getChudstackSessionParticipants = db.prepare(`
	SELECT discord_id, joined_at, current_joined_at, accumulated_seconds
	FROM chudstack_session_participants
	WHERE session_id = ?
	ORDER BY joined_at ASC, discord_id ASC
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
		const participants = getChudstackSessionParticipants.all(sessionId) as Array<{
			discord_id: string;
			joined_at: number;
			current_joined_at: number | null;
			accumulated_seconds: number;
		}>;

		if (!session) {
			await interaction.reply(`No chudstack session found for id ${sessionId}.`);
			return;
		}

		const startTime = `<t:${session.start_time}>`;
		const endTime = session.end_time ? `<t:${session.end_time}>` : "still running";
		const duration = session.duration_seconds === null ? "still running" : `${session.duration_seconds}s`;
		const now = Math.floor(Date.now() / 1000);
		const participantList = participants.length
			? participants
				.map((participant) => {
					const activeSeconds = participant.current_joined_at === null ? 0 : Math.max(0, now - participant.current_joined_at);
					const totalSeconds = participant.accumulated_seconds + activeSeconds;
					const status = participant.current_joined_at === null ? "left" : `in vc since <t:${participant.current_joined_at}:f>`;
					return `<@${participant.discord_id}> - ${totalSeconds}s total, ${status}`;
				})
				.join("\n")
			: "None yet";

		await interaction.reply([
			`Session #${session.id}`,
			`Guild: ${session.guild_id}`,
			`Channel: ${session.channel_id}`,
			`Start: ${startTime}`,
			`End: ${endTime}`,
			`Duration: ${duration}`,
			`Participants:\n${participantList}`,
		].join("\n"));
	},
};

export default testSessionTrackerCommand;
