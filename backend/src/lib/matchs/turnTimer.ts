import { Server } from "socket.io";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { isTeamEliminated, setFinalPlacement } from "./matchUtils.ts";
import { currentMatches } from "../../mapMatches.ts";

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
const timers = new Map<string, NodeJS.Timeout>()

export function getRemaining(match: Matchs): number {
	const elapsed = Date.now() - match.turns.timerStart

	return Math.max(0, Math.ceil((((match.step === "deploy" ? 30 : match.settings.time_turn) * 1000) - elapsed) / 1000))
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
	timers.set(match.hostId, setTimeout(() => {
		if (match.step === "deploy") {
			match.step = "game"
			nextTurn(match, io, false)
		} else {
			nextTurn(match, io, true)
		}
	}, ((match.step === "deploy" ? 30 : match.settings.time_turn) * 1000)))
	emitTurn(match, io)
}

export function nextTurn(match: Matchs, io: IO, changePlayer: boolean) {
	if (match.endedAt !== 0)
		return

	const aliveTeams = match.teams.filter(t => !isTeamEliminated(match, t.id))
	if (aliveTeams.length <= 1) {
		stopTurns(match)
		const players = match.players.filter(p => p.placement === 0)
		for (const player of players)
			setFinalPlacement(match, player.userId ?? "")

		// TODO: ajouter la logique de fin
		emitTurn(match, io)
		// currentMatches.delete(match.hostId)
		return
	}

	const order = match.turns.turnOrder
	const current = order.indexOf(match.turns.userTurn ?? "")

	if (changePlayer) {
		let next: string | null = null
		for (let i = 1; i <= order.length; i++) {
			const candidate = order[(current + i) % order.length]
			const teamId = match.players.find(p => p.userId === candidate)?.team

			if (candidate && teamId !== undefined && !isTeamEliminated(match, teamId)) {
				next = candidate
				break
			}
		}

		match.turns.userTurn = next
		match.turns.isBotTurn = match.players.find(p => p.userId === next)?.isBot ?? false
	}
	match.turns.timerStart = Date.now()

	startTurnTimer(match, io)
}

export function stopTurns(match: Matchs) {
	clearTimeout(timers.get(match.hostId))
	match.endedAt = Date.now()
	timers.delete(match.hostId)
}