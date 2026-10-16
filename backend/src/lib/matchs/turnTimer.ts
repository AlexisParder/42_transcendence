import { Server } from "socket.io";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { filterMatchForUser, isTeamEliminated, setFinalPlacement, updatePlayer } from "./matchUtils.ts";
import { currentMatches } from "../../mapMatches.ts";
import { fillRandomShips } from "./shipValidation.ts";
import { finishMatch } from "./finishMatch.ts";
import { cancelDisconnectTimer, clearMatchDisconnectTimers } from "./disconnectTimers.ts";

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
const timers = new Map<string, NodeJS.Timeout>()

export function getRemaining(match: Matchs): number {
	const elapsed = Date.now() - match.turns.timerStart

	return Math.max(0, Math.ceil((((match.step === "deploy" ? 30 : match.settings.time_turn) * 1000) - elapsed) / 1000))
}

export function emitTurn(match: Matchs, io: IO) {
	const data = { remaining: getRemaining(match) }

	for (const player of match.players) {
		if (player.userId) {
			io.to(player.userId).emit("turn_update", data)
			io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}
	}
}

export function startTurnTimer(match: Matchs, io: IO) {
	clearTimeout(timers.get(match.hostId))
	timers.set(match.hostId, setTimeout(() => {
		if (match.step === "deploy") {
			endDeploy(match, io)
		} else {
			nextTurn(match, io, true)
		}
	}, ((match.step === "deploy" ? 30 : match.settings.time_turn) * 1000)))
	emitTurn(match, io)
}

export function endDeploy(match: Matchs, io: IO) {
	for (const team of match.teams)
		team.ships = fillRandomShips(team.ships)

	match.step = "game"
	nextTurn(match, io, false)
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

		for (const player of match.players) {
			if (player.isBot || !player.userId)
				continue

			let shotsCount = 0
			let hitsCount = 0
			for (const team of match.teams.filter(t => t.id !== player.team)) {
				shotsCount += team.shots.filter(s => s.authorId === player.userId).length
				hitsCount += team.shots.filter(s => s.authorId === player.userId && s.status !== "miss").length
			}
			updatePlayer(match, player.userId, { shotsHit: hitsCount, shotsTotal: shotsCount })
		}

		finishMatch(match, io).catch(err => console.log("finish match:", err))
		return
	}

	const order = match.turns.turnOrder
	const current = order.indexOf(match.turns.userTurn ?? "")

	if (changePlayer) {
		let next: string | null = null
		for (let i = 1; i <= order.length; i++) {
			const candidate = order[(current + i) % order.length]
			const candidatePlayer = match.players.find(p => p.userId === candidate)

			if (candidate && candidatePlayer && candidatePlayer.status !== "LEFT" && !isTeamEliminated(match, candidatePlayer.team)) {
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

export function markPlayerLeft(match: Matchs, userId: string, io: IO) {
	const player = match.players.find(p => p.userId === userId)

	cancelDisconnectTimer(match.hostId, userId)
	if (match.endedAt !== 0 || !player || player.status === "LEFT")
		return

	if (match.startedAt === 0) {
		if (match.hostId === userId) {
			for (const player of match.players) {
				if (player.userId)
					io.to(player.userId).emit("refresh_joined_match", undefined)
			}

			clearMatchDisconnectTimers(match.hostId)
			currentMatches.delete(userId)
		} else {
			match.players = match.players.filter(p => p.userId !== userId)
			for (const player of match.players) {
				if (player.userId)
					io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
			}
		}
		return
	}

	if (player.placement > 0)
		return

	updatePlayer(match, userId, {
		status: "LEFT",
		leftAt: player.leftAt === 0 ? Date.now() : player.leftAt
	})
	setFinalPlacement(match, userId)

	const aliveTeams = match.teams.filter(t => !isTeamEliminated(match, t.id))

	if (match.turns.userTurn === userId)
		nextTurn(match, io, true)
	else if (aliveTeams.length <= 1)
		nextTurn(match, io, false)
	else
		emitTurn(match, io)
}