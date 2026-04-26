import Database from "better-sqlite3";
export const db = new Database("src/data/chudstack.db");

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export async function loadDb() {
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
	`;

	db.exec(schema);
}


