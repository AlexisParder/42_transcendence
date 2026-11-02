import type { Server } from "socket.io"
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts"
import { filterMatchForUser, updatePlayer, isListening } from "./matchUtils.ts"
import { currentMatches } from "../../mapMatches.ts"
import { emitTurn, markPlayerLeft } from "./turnTimer.ts"

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

const DISCONNECT_GRACE_MS = 30 * 1000

const disconnectTimers = new Map<string, NodeJS.Timeout>()

function timerKey(hostId: string, userId: string) {
	return `${hostId}:${userId}`
}

function emitMatch(match: Matchs, io: IO) {
	for (const player of match.players) {
		if (isListening(player))
			io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
	}
}

export function startDisconnectTimer(match: Matchs, userId: string, io: IO) {
	const player = match.players.find(p => p.userId === userId)
	if (match.endedAt !== 0 || !player || player.status === "LEFT")
		return

	const key = timerKey(match.hostId, userId)
	clearTimeout(disconnectTimers.get(key))

	updatePlayer(match, userId, { leftAt: Date.now() })

	disconnectTimers.set(key, setTimeout(() => {
		disconnectTimers.delete(key)

		if (currentMatches.get(match.hostId) !== match || match.endedAt !== 0)
			return

		const current = match.players.find(p => p.userId === userId)
		if (!current || current.status === "LEFT" || current.leftAt === 0)
			return

		markPlayerLeft(match, userId, io)
	}, DISCONNECT_GRACE_MS))

	emitMatch(match, io)
}

export function cancelDisconnectTimer(hostId: string, userId: string) {
	const key = timerKey(hostId, userId)
	const timer = disconnectTimers.get(key)

	if (!timer)
		return false

	clearTimeout(timer)
	disconnectTimers.delete(key)
	return true
}

export function reconnectPlayer(match: Matchs, userId: string, io: IO) {
	const player = match.players.find(p => p.userId === userId)

	if (match.endedAt !== 0 || !player || player.status === "LEFT")
		return

	cancelDisconnectTimer(match.hostId, userId)
	updatePlayer(match, userId, { leftAt: 0 })

	if (match.startedAt !== 0)
		emitTurn(match, io)
	else
		emitMatch(match, io)
}

export function clearMatchDisconnectTimers(hostId: string) {
	const prefix = `${hostId}:`

	for (const  [key, timer] of disconnectTimers) {
		if (key.startsWith(prefix)) {
			clearTimeout(timer)
			disconnectTimers.delete(key)
		}
	}
}