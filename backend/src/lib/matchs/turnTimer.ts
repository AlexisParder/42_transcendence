import { Server } from "socket.io";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
const timers = new Map<string, NodeJS.Timeout>()

export function getRemaining(match: Matchs): number {
	const elapsed = Date.now() - match.turns.timerStart

	return Math.max(0, Math.ceil(((match.settings.time_turn * 1000) - elapsed) / 1000))
}

function emitTurn(match: Matchs, io: IO) {
	const data = { remaining: getRemaining(match) }

	for (const player of match.players) {
		if (player.userId) {
			io.to(player.userId).emit("turn_update", data)
			io.to(player.userId).emit("refresh_joined_match", match)
		}
	}
}

export function startTurnTimer(match: Matchs, io: IO) {
	clearTimeout(timers.get(match.hostId))
	timers.set(match.hostId, setTimeout(() => nextTurn(match, io), (match.settings.time_turn * 1000)))
	emitTurn(match, io)
}

export function nextTurn(match: Matchs, io: IO) {
	const order = match.turns.turnOrder
	const current = order.indexOf(match.turns.userTurn ?? "")
	const next = order[(current + 1) % order.length] ?? null

	match.turns.userTurn = next
	match.turns.isBotTurn = match.players.find(p => p.userId === next)?.isBot ?? false
	match.turns.timerStart = Date.now()

	startTurnTimer(match, io)
}

export function stopTurns(match: Matchs) {
	clearTimeout(timers.get(match.hostId))
	timers.delete(match.hostId)
}