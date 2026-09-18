import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import { formatMatch } from "../lib/matchFormat.ts";
import type { Stat } from "../events.ts";

export async function getUserStatsHandler(req: Request, res: Response) {
	const { targetId } = req.body

	if (targetId !== undefined && typeof targetId !== "string")
		return res.status(400).json({ ok: false })

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
			userId = target?.id ?? session.user.id
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
					leftAt: true,
					matchs: {
						select: {
							id: true,
							mode: true,
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
				}
			}),
			prisma.matchPlayers.count({ where: { userId } }),
			prisma.matchPlayers.count({
				where: {
					userId,
					OR: [
						{ matchs: { isRanked: true }, points: { gt: 0 } },
						{ matchs: { isRanked: false }, placement: 1 }
					]
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
			tournamentsWon: 0,
		}

		res.json({ ok: true, stats, matchs: rows.map(row => formatMatch(row, userId)) })
	} catch (error) {
		console.error("get-user-stats error:", error)
		res.status(500).json({ ok: false })
	}
}