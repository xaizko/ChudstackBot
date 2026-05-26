import { Events, type VoiceState } from "discord.js";
import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import type { BotEvent } from "../types/event.js";
import type { BotClient } from "../index.js";

const idleDisconnectTimers = new Map<string, NodeJS.Timeout>();

const voiceStatusUpdate: BotEvent = {
	name: Events.VoiceStateUpdate,
	async execute(...args: unknown[]) {
		const [oldState, newState] = args as [VoiceState, VoiceState];
		const guildID = newState.guild.id;
		const connection = getVoiceConnection(guildID);
		const channel = newState.channel ?? oldState.channel;
		const client = newState.client as BotClient;
		const botId = client.user?.id;

		if (!connection || !channel || !botId) {
			const timer = idleDisconnectTimers.get(guildID);
			if (timer) {
				clearTimeout(timer);
				idleDisconnectTimers.delete(guildID);
			}
			return;
		}

		const timer = idleDisconnectTimers.get(guildID);
		const botIsAlone = channel.members.has(botId) && channel.members.size <= 1;

		// Clears timer if bot is not alone
		if (!botIsAlone) {
			if (timer) {
				clearTimeout(timer);
				idleDisconnectTimers.delete(guildID);
			}
			return;
		}

		// Do nothing if there is already a timer
		if (timer) return;

		// Sets a timer if bot is alone
		const LOCKOUT_TIMER = 5 * 60 * 1000;
		idleDisconnectTimers.set(
			guildID,
			setTimeout(() => {
				idleDisconnectTimers.delete(guildID);

				const activeConnection = getVoiceConnection(guildID);

				if (
					activeConnection &&
					activeConnection.state.status !== VoiceConnectionStatus.Destroyed &&
					channel.members.has(botId) &&
					channel.members.size <= 1
				) {
					activeConnection.destroy();
				}
			}, LOCKOUT_TIMER),
		);
	}
};

export default voiceStatusUpdate;

