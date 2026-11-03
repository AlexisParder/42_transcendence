import type { Request, Response } from "express"
import { prisma } from "../db/client.ts"
import type { Matchs } from "../events.ts"

export async function getStatsHandler(req: Request, res: Response) {
	try {
		const currentMatches = req.app.get("currentMatches") as Map<number, Matchs>
		const matches = Array.from(currentMatches.values())

		const played = await prisma.matchs.count()
		const inProgress = matches.filter(m => m.startedAt !== 0 && m.endedAt === 0).length
		const open = matches.filter(m => m.visibility === "public" && m.startedAt === 0 && m.players.length < m.maxPlayers).length

		res.json({ ok: true, played, inProgress, open })
	} catch (error) {
		console.error("get-stats error:", error)
		res.status(500).json({ ok: false })
	}
}
