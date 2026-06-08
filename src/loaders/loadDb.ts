import Database from "better-sqlite3";
export const db = new Database("src/data/chudstack.db");

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function ensureColumn(tableName: string, columnName: string, columnDefinition: string) {
	const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
	if (columns.some((column) => column.name === columnName)) return;

	db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
}

export function loadDb() {
	const schema = `
		CREATE TABLE IF NOT EXISTS users (
			discord_id TEXT PRIMARY KEY
		);

		CREATE TABLE IF NOT EXISTS stats (
			discord_id TEXT PRIMARY KEY,
			total_wins INTEGER DEFAULT 0,
			total_losses INTEGER DEFAULT 0,
			vc_seconds INTEGER DEFAULT 0,
			FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS profile_links (
			discord_id TEXT PRIMARY KEY,
			steam_id  TEXT,
			FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS chudstack_sessions(
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			guild_id TEXT NOT NULL,
			channel_id TEXT NOT NULL,
			start_time INTEGER NOT NULL,
			end_time INTEGER,
			duration_seconds INTEGER
		);

		CREATE TABLE IF NOT EXISTS chudstack_session_participants(
			session_id INTEGER NOT NULL,
			discord_id TEXT NOT NULL,
			joined_at INTEGER NOT NULL,
			current_joined_at INTEGER,
			accumulated_seconds INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (session_id, discord_id),
			FOREIGN KEY (session_id) REFERENCES chudstack_sessions(id) ON DELETE CASCADE
		);
	`;

	db.exec(schema);
	ensureColumn("chudstack_session_participants", "current_joined_at", "current_joined_at INTEGER");
	ensureColumn("chudstack_session_participants", "accumulated_seconds", "accumulated_seconds INTEGER NOT NULL DEFAULT 0");
}


