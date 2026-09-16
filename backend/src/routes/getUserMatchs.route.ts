import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import { formatMatch } from "../lib/matchFormat.ts";

export async function getUserMatchsHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const data = await prisma.matchPlayers.findMany({
			where: { userId },
			orderBy: {
				matchs: { startedAt: 'desc' }
			},
			select: {
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
		})

		res.json({ ok: true, matchs: data.map(row => formatMatch(row, userId)) })
	} catch (error) {
		console.error("get-user-rank error:", error)
		res.status(500).json({ ok: false })
	}
}