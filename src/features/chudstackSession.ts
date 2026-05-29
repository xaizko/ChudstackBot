import { db } from "../loaders/loadDb.js";

type ActiveChudstackSession = {
	id: number;
	start_time: number;
};

const insertChudstackSession = db.prepare(`
	INSERT INTO chudstack_sessions (guild_id, channel_id, start_time)
	VALUES (?, ?, ?)
`);

const getActiveChudstackSession = db.prepare(`
	SELECT id, start_time
	FROM chudstack_sessions
	WHERE guild_id = ? AND channel_id = ? AND end_time IS NULL
	ORDER BY id DESC
	LIMIT 1
`);

const endChudstackSession = db.prepare(`
	UPDATE chudstack_sessions
	SET end_time = ?, duration_seconds = ?
	WHERE id = ?
`);

export function startChudstackSession(guildId: string, channelId: string, startedAt: number) {
	insertChudstackSession.run(guildId, channelId, startedAt);
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