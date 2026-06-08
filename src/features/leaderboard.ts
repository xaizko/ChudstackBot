import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction,
} from "discord.js";
import { db } from "../loaders/loadDb.js";

type TimeLeaderboardRow = {
	discord_id: string;
	vc_seconds: number;
};

type TimeLeaderboardPage = {
	content: string;
	components: ActionRowBuilder<ButtonBuilder>[];
	page: number;
	totalPages: number;
};

const DEFAULT_PAGE_SIZE = 10;
export const TIME_LEADERBOARD_BUTTON_PREFIX = "leaderboard-time";

const countTimeLeaderboardRows = db.prepare(`
	SELECT COUNT(*) AS total
	FROM stats
`);

const getTimeLeaderboardRows = db.prepare(`
	SELECT discord_id, vc_seconds
	FROM stats
	ORDER BY vc_seconds DESC, discord_id ASC
	LIMIT ? OFFSET ?
`);

function formatDuration(seconds: number) {
	const safeSeconds = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.floor((safeSeconds % 3600) / 60);
	const remainingSeconds = safeSeconds % 60;

	if (!hours && !minutes) return `${remainingSeconds}s`;
	if (!hours) return `${minutes}m ${remainingSeconds}s`;
	if (!minutes) return `${hours}h ${remainingSeconds}s`;
	return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

export function buildTimeLeaderboardPage(pageNumber: number, pageSize = DEFAULT_PAGE_SIZE): TimeLeaderboardPage {
	const totalResult = countTimeLeaderboardRows.get() as { total: number };
	const totalEntries = totalResult.total;

	if (totalEntries === 0) {
		return {
			content: "No leaderboard data yet.",
			components: [],
			page: 0,
			totalPages: 0,
		};
	}

	const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
	const page = Math.min(Math.max(1, pageNumber), totalPages);
	const offset = (page - 1) * pageSize;
	const rows = getTimeLeaderboardRows.all(pageSize, offset) as TimeLeaderboardRow[];

	const startRank = offset + 1;
	const endRank = offset + rows.length;
	const lines = rows.map((row, index) => {
		const rank = startRank + index;
		return `${rank}. <@${row.discord_id}> - ${formatDuration(row.vc_seconds)}`;
	});

	const content = [
		`VC Time Leaderboard`,
		`Showing ${startRank}-${endRank} of ${totalEntries}`,
		"",
		...lines,
		"",
		`Page ${page}/${totalPages}`,
	].join("\n");

	const components: ActionRowBuilder<ButtonBuilder>[] = [];
	if (totalPages > 1) {
		const previousButton = new ButtonBuilder()
			.setCustomId(`${TIME_LEADERBOARD_BUTTON_PREFIX}:${page - 1}`)
			.setLabel("Previous")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("⬅️")
			.setDisabled(page <= 1);

		const nextButton = new ButtonBuilder()
			.setCustomId(`${TIME_LEADERBOARD_BUTTON_PREFIX}:${page + 1}`)
			.setLabel("Next")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➡️")
			.setDisabled(page >= totalPages);

		components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(previousButton, nextButton));
	}

	return {
		content,
		components,
		page,
		totalPages,
	};
}

export function isTimeLeaderboardButton(customId: string) {
	return customId.startsWith(`${TIME_LEADERBOARD_BUTTON_PREFIX}:`);
}

export async function handleTimeLeaderboardButton(interaction: ButtonInteraction) {
	if (!isTimeLeaderboardButton(interaction.customId)) return false;

	const requestedPage = Number(interaction.customId.split(":")[1]);
	const page = Number.isFinite(requestedPage) ? requestedPage : 1;
	const leaderboardPage = buildTimeLeaderboardPage(page);

	await interaction.update({
		content: leaderboardPage.content,
		components: leaderboardPage.components,
	});

	return true;
}
