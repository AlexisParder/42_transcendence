import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { isOptionalOffset } from "../lib/validate.ts"
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import type { LeaderboardInfo } from "../events.ts";

export async function getLeaderboardInfosHandler(req: Request, res: Response) {
	const { offset, filter } = req.body ?? {}

	if (!isOptionalOffset(offset))
		return res.status(400).json({ ok: false })

	if (filter !== undefined && filter !== "global" && filter !== "friends")
		return res.status(400).json({ ok: false })

	const skip = offset ?? 0

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		let userWhere = {}

		if (filter === "friends") {
			const friendLinks = await prisma.friends.findMany({
				where: {
					isAccepted: true,
					OR: [
						{ userId },
						{ targetId: userId },
					]
				},
				select: { userId: true, targetId: true }
			})

			const friendIds = friendLinks.map(f => f.userId === userId ? f.targetId : f.userId)

			friendIds.push(userId)
			userWhere = { id: { in: friendIds } }
		}

		const rows = await prisma.user.findMany({
			where: userWhere,
			select: {
				id: true,
				username: true,
				image: true,
				points: true
			},
			orderBy: [{ points: "desc" }, { id: "asc" }],
			skip,
			take: 20
		})

		const pageIds = rows.map(r => r.id)

		const [totals, wins] = await Promise.all([
			prisma.matchPlayers.groupBy({
				by: ['userId'],
				where: { userId: { in: pageIds } },
				_count: { _all: true },
				_sum: { shotsHit: true, shotsTotal: true }
			}),
			prisma.matchPlayers.groupBy({
				by: ['userId'],
				where: {
					userId: { in: pageIds },
					placement: 1,
					status: { not: "LEFT" }
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
				pos: skip + index + 1,
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