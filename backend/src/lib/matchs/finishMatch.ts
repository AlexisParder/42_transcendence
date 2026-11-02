import type { Server } from "socket.io";
import type { ClientToServerEvents, Matchs, matchType, ServerToClientEvents, SocketData } from "../../events.ts";
import { currentMatches } from "../../mapMatches.ts";
import { prisma } from "../../db/client.ts";
import type { PairMatchIndex } from "./eloLib.ts";
import { filterMatchForUser } from "./matchUtils.ts";
import { applyEloToMatch, computeMatchElo, isRankedmatch } from "./eloMatchAdapater.ts";
import { clearMatchDisconnectTimers } from "./disconnectTimers.ts";
import { checkAchievements } from "../achievements.ts";

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

const DAY_MS = 24 * 60 * 60 * 1000

function pairKey(a: string, b: string) {
	return a < b ? `${a}|${b}` : `${b}|${a}`
}

async function loadRankedGames(userIds: string[]): Promise<Map<string, number>> {
	const counts = await Promise.all(
		userIds.map(userId =>
			prisma.matchPlayers.count({
				where: { userId, matchs: { isRanked: true } }
			})
		)
	)

	return new Map(userIds.map((id, i) => [id, counts[i]]))
}

async function loadPairMatchIndex(userIds: string[]): Promise<PairMatchIndex> {
	const recentmatches = await prisma.matchs.findMany({
		where: {
			isRanked: true,
			endedAt: { gte: new Date(Date.now() - DAY_MS) },
			players: { some: { userId: { in: userIds } } }
		},
		select: { players: { select: { userId: true } } }
	})

	const pairCounts = new Map<string, number>()
	for (const m of recentmatches) {
		const ids = m.players.map(p => p.userId).filter((id): id is string => id !== null && userIds.includes(id))

		for (let i = 0; i < ids.length; i++) {
			for (let j = i + 1; j < ids.length; j++) {
				const key = pairKey(ids[i], ids[j])
				pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
			}
		}
	}

	return (a, b) => (pairCounts.get(pairKey(a, b)) ?? 0) + 1
}

async function saveMatch(match: Matchs, ranked: boolean, deltas: Map<string, number>) {
	const createMatch = prisma.matchs.create({
		data: {
			type: match.type as matchType,
			isRanked: ranked,
			startedAt: new Date(match.startedAt),
			endedAt: new Date(match.endedAt),
			players: {
				create: match.players.map(p => ({
					userId: p.isBot ? null : p.userId,
					isBot: p.isBot,
					team: p.team,
					placement: p.placement,
					points: p.matchPoints,
					leftAt: p.status === "LEFT" && p.leftAt !== 0 ? new Date(p.leftAt) : null,
					status: p.status,
					shotsHit: p.shotsHit,
					shotsTotal: p.shotsTotal
				}))
			}
		}
	})

	const updateUsers = [...deltas].map(([userId, delta]) =>
		prisma.user.update({
			where: { id: userId },
			data: { points: { increment: delta } }
		})
	)

	await prisma.$transaction([createMatch, ...updateUsers])
}

function emitFinalState(match: Matchs, io: IO) {
	for (const player of match.players) {
		if (player.userId && !player.isBot && player.status !== "LEFT")
			io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
	}
	for (const spectator of match.spectators) {
		if (spectator)
			io.to(spectator).emit("refresh_joined_match", filterMatchForUser(match, spectator))
	}
}

export async function finishMatch(match: Matchs, io: IO) {
	clearMatchDisconnectTimers(match.hostId)

	try {
		const ranked = isRankedmatch(match)
		const deltas = new Map<string, number>()

		if (ranked) {
			const userIds = match.players.map(p => p.userId).filter((id): id is string => id !== null)

			const [rankedGames, pairMatchIndex] = await Promise.all([
				loadRankedGames(userIds),
				loadPairMatchIndex(userIds)
			])

			const results = computeMatchElo(match, rankedGames, pairMatchIndex)
			applyEloToMatch(match, results)

			for (const r of results)
				deltas.set(r.id, r.delta)
		}

		await saveMatch(match, ranked, deltas)

		for (const player of match.players) {
			if (player.userId && !player.isBot)
				await checkAchievements(player.userId)
		}
	} finally {
		emitFinalState(match, io)

		if (currentMatches.get(match.hostId) === match)
			currentMatches.delete(match.hostId)
	}
}