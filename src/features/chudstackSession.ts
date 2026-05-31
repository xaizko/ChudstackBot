import { db } from "../loaders/loadDb.js";

type ActiveChudstackSession = {
	id: number;
	start_time: number;
};

type ChudstackSessionParticipant = {
	discord_id: string;
	joined_at: number;
};

const insertChudstackSession = db.prepare(`
	INSERT INTO chudstack_sessions (guild_id, channel_id, start_time)
	VALUES (?, ?, ?)
`);

const insertChudstackSessionParticipant = db.prepare(`
	INSERT OR IGNORE INTO chudstack_session_participants (session_id, discord_id, joined_at)
	VALUES (?, ?, ?)
`);

const getActiveChudstackSession = db.prepare(`
	SELECT id, start_time
	FROM chudstack_sessions
	WHERE guild_id = ? AND channel_id = ? AND end_time IS NULL
	ORDER BY id DESC
	LIMIT 1
`);

const getChudstackSessionParticipants = db.prepare(`
	SELECT discord_id, joined_at
	FROM chudstack_session_participants
	WHERE session_id = ?
	ORDER BY joined_at ASC, discord_id ASC
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

	insertChudstackSessionParticipant.run(activeSession.id, discordId, joinedAt);
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

	const durationSeconds = Math.max(0, endedAt - activeSession.start_time);
	endChudstackSession.run(endedAt, durationSeconds, activeSession.id);
	return true;
}