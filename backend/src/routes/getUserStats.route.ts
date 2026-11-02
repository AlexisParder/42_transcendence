import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { isOptionalOffset, isOptionalString } from "../lib/validate.ts"
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import { formatMatch } from "../lib/matchs/matchFormat.ts";
import type { Stat } from "../events.ts";

export async function getUserStatsHandler(req: Request, res: Response) {
	const { targetId, offset } = req.body ?? {}

	if (!isOptionalString(targetId) || !isOptionalOffset(offset))
		return res.status(400).json({ ok: false })

	const skip = offset ?? 0

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		let userId = session.user.id
		if (targetId) {
			const target = await prisma.user.findUnique({
				where: { id: targetId },
				select: { id: true }
			})
			if (!target)
				return res.status(404).json({ ok: false })

			userId = target.id
		}

		const [rows, total, wins, shots] = await Promise.all([
			prisma.matchPlayers.findMany({
				where: { userId },
				orderBy: {
					matchs: { startedAt: 'desc' }
				},
				select: {
					id: true,
					team: true,
					placement: true,
					points: true,
					status: true,
					leftAt: true,
					matchs: {
						select: {
							id: true,
							type: true,
							isRanked: true,
							startedAt: true,
							endedAt: true,
							players: {
								select: {
									userId: true,
									isBot: true,
									team: true,
									placement: true,
									points: true,
									user: {
										select: { id: true, username: true }
									}
								}
							}
						}
					}
				},
				skip,
				take: 20
			}),
			prisma.matchPlayers.count({ where: { userId } }),
			prisma.matchPlayers.count({
				where: {
					userId,
					placement: 1,
					status: { not: "LEFT" }
				}
			}),
			prisma.matchPlayers.aggregate({
				where: { userId },
				_sum: { shotsHit: true, shotsTotal: true }
			})
		])

		const stats: Stat = {
			total,
			winRate: total ? Math.round((wins / total) * 100) : 0,
			shotAccuracy: shots._sum.shotsTotal ? Math.round((shots._sum.shotsHit! / shots._sum.shotsTotal!) * 100) : 0,
		}

		res.json({ ok: true, stats, matchs: rows.map(row => formatMatch(row, userId)) })
	} catch (error) {
		console.error("get-user-stats error:", error)
		res.status(500).json({ ok: false })
	}
}