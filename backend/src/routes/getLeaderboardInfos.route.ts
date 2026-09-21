import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import type { LeaderboardInfo } from "../events.ts";

export async function getLeaderboardInfosHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const [rows, totals, wins] = await Promise.all([
			prisma.user.findMany({
				select: {
					id: true,
					username: true,
					image: true,
					points: true
				},
				orderBy: { points: "desc" }
			}),
			prisma.matchPlayers.groupBy({
				by: ['userId'],
				_count: { _all: true },
				_sum: { shotsHit: true, shotsTotal: true }
			}),
			prisma.matchPlayers.groupBy({
				by: ['userId'],
				where: {
					OR: [
						{ matchs: { isRanked: true }, points: { gt: 0 } },
						{ matchs: { isRanked: false }, placement: 1 }
					]
				},
				_count: { _all: true }
			})
		])

		const totalsMap = new Map(totals.map(t => [t.userId, t]))
		const winsMap = new Map(wins.map(w => [w.userId, w._count._all]))

		const ldbInfos: LeaderboardInfo[] = rows.map((row, index) => {
			const t = totalsMap.get(row.id)
			const matches = t?._count._all ?? 0
			const win = winsMap.get(row.id) ?? 0
			const shotsHit = t?._sum.shotsHit ?? 0
			const shotsTotal = t?._sum.shotsTotal ?? 0

			return {
				id: row.id,
				username: row.username,
				image: row.image,
				points: row.points,
				isMine: row.id === userId,
				pos: index + 1,
				matches,
				win,
				lose: matches - win,
				accuracy: shotsTotal ? Math.round((shotsHit / shotsTotal) * 100) : 0
			}
		})
		res.json({ ok: true, ldbInfos })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}