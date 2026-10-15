import type { Server } from "socket.io";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { currentMatches } from "../../mapMatches.ts";
import { emitTurn } from "./turnTimer.ts";
import { prisma } from "../../db/client.ts";
import type { PairMatchIndex } from "./eloLib.ts";

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

export async function finishMatch(match: Matchs, io: IO) {
	if (match.isRanked) {
		for (const player of match.players) {
			if (player.isBot || !player.userId)
				continue
		}
	}

	emitTurn(match, io)
	currentMatches.delete(match.hostId)
}