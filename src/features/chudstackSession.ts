import { db } from "../loaders/loadDb.js";

type ActiveChudstackSession = {
	id: number;
	start_time: number;
};

type ChudstackSessionParticipant = {
	discord_id: string;
	joined_at: number;
	current_joined_at: number | null;
	accumulated_seconds: number;
};

const insertChudstackSession = db.prepare(`
	INSERT INTO chudstack_sessions (guild_id, channel_id, start_time)
	VALUES (?, ?, ?)
`);

const insertChudstackSessionParticipant = db.prepare(`
	INSERT INTO chudstack_session_participants (
		session_id,
		discord_id,
		joined_at,
		current_joined_at,
		accumulated_seconds
	)
	VALUES (?, ?, ?, ?, 0)
	ON CONFLICT(session_id, discord_id) DO UPDATE SET
		current_joined_at = CASE
			WHEN chudstack_session_participants.current_joined_at IS NULL THEN excluded.current_joined_at
			ELSE chudstack_session_participants.current_joined_at
		END
`);

const updateChudstackSessionParticipantLeave = db.prepare(`
	UPDATE chudstack_session_participants
	SET accumulated_seconds = accumulated_seconds + MAX(0, ? - current_joined_at),
		current_joined_at = NULL
	WHERE session_id = ? AND discord_id = ? AND current_joined_at IS NOT NULL
`);

const finalizeOpenChudstackSessionParticipants = db.prepare(`
	UPDATE chudstack_session_participants
	SET accumulated_seconds = accumulated_seconds + MAX(0, ? - current_joined_at),
		current_joined_at = NULL
	WHERE session_id = ? AND current_joined_at IS NOT NULL
`);

const ensureUser = db.prepare(`
	INSERT INTO users (discord_id) VALUES (?)
	ON CONFLICT(discord_id) DO NOTHING
`);

const ensureStats = db.prepare(`
	INSERT INTO stats (discord_id) VALUES (?)
	ON CONFLICT(discord_id) DO NOTHING
`);

const addStatsVcSeconds = db.prepare(`
	UPDATE stats
	SET vc_seconds = vc_seconds + ?
	WHERE discord_id = ?
`);

const getActiveChudstackSession = db.prepare(`
	SELECT id, start_time
	FROM chudstack_sessions
	WHERE guild_id = ? AND channel_id = ? AND end_time IS NULL
	ORDER BY id DESC
	LIMIT 1
`);

const getChudstackSessionParticipants = db.prepare(`
	SELECT discord_id, joined_at, current_joined_at, accumulated_seconds
	FROM chudstack_session_participants
	WHERE session_id = ?
	ORDER BY joined_at ASC, discord_id ASC
`);

const getChudstackSessionParticipantSeconds = db.prepare(`
	SELECT discord_id, accumulated_seconds
	FROM chudstack_session_participants
	WHERE session_id = ?
`);

const endChudstackSession = db.prepare(`
	UPDATE chudstack_sessions
	SET end_time = ?, duration_seconds = ?
	WHERE id = ?
`);

export function startChudstackSession(guildId: string, channelId: string, startedAt: number) {
	insertChudstackSession.run(guildId, channelId, startedAt);
}

export function recordChudstackParticipant(
	guildId: string,
	channelId: string,
	discordId: string,
	joinedAt = Math.floor(Date.now() / 1000),
) {
	const activeSession = getActiveChudstackSession.get(guildId, channelId) as ActiveChudstackSession | undefined;
	if (!activeSession) return false;

	insertChudstackSessionParticipant.run(activeSession.id, discordId, joinedAt, joinedAt);
	return true;
}

export function recordChudstackParticipantLeave(
	guildId: string,
	channelId: string,
	discordId: string,
	leftAt = Math.floor(Date.now() / 1000),
) {
	const activeSession = getActiveChudstackSession.get(guildId, channelId) as ActiveChudstackSession | undefined;
	if (!activeSession) return false;

	updateChudstackSessionParticipantLeave.run(leftAt, activeSession.id, discordId);
	return true;
}

export function getChudstackSessionParticipantList(sessionId: number) {
	return getChudstackSessionParticipants.all(sessionId) as ChudstackSessionParticipant[];
}

export function closeChudstackSession(
	guildId: string,
	channelId: string,
	endedAt = Math.floor(Date.now() / 1000),
) {
	const activeSession = getActiveChudstackSession.get(guildId, channelId) as ActiveChudstackSession | undefined;
	if (!activeSession) return false;

	db.transaction(() => {
		const durationSeconds = Math.max(0, endedAt - activeSession.start_time);
		endChudstackSession.run(endedAt, durationSeconds, activeSession.id);
		finalizeOpenChudstackSessionParticipants.run(endedAt, activeSession.id);

		const participantSeconds = getChudstackSessionParticipantSeconds.all(activeSession.id) as Array<{
			discord_id: string;
			accumulated_seconds: number;
		}>;

		for (const participant of participantSeconds) {
			if (participant.accumulated_seconds <= 0) continue;

			ensureUser.run(participant.discord_id);
			ensureStats.run(participant.discord_id);
			addStatsVcSeconds.run(participant.accumulated_seconds, participant.discord_id);
		}
	})();
	return true;
}