import type { Server } from "socket.io"
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../../events.ts"
import { currentMatches } from "../../../mapMatches.ts"
import { isTeamEliminated } from "../matchUtils.ts"
import { fireShot } from "../fireShot.ts"
import { chooseBotTarget } from "./botTarget.ts"

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

const BOT_THINKING_MS = 1500

const botTimers = new Map<string, NodeJS.Timeout>()

export function scheduleBotTurn(match: Matchs, io: IO) {
	clearBotTurn(match.hostId)
	botTimers.set(match.hostId, setTimeout(() => {
		botTimers.delete(match.hostId)
		playBotTurn(match, io)
	}, BOT_THINKING_MS))
}

export function clearBotTurn(hostId: string) {
	clearTimeout(botTimers.get(hostId))
	botTimers.delete(hostId)
}

function playBotTurn(match: Matchs, io: IO) {
	if (currentMatches.get(match.hostId) !== match || match.endedAt !== 0 || match.step !== "game")
		return

	const bot = match.players.find(p => p.isBot && p.userId === match.turns.userTurn)
	if (!bot)
		return

	const target = match.teams.find(t => t.id !== bot.team && !isTeamEliminated(match, t.id))
	if (!target)
		return

	fireShot(match, bot, target, chooseBotTarget(target.shots), io)
}
