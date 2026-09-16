import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";

export async function getUserRankHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		let rank = await prisma.ranks.findFirst({
			where: {
				min: {
					lte: session.user.points ?? 0
				}
			},
			orderBy: { min: 'desc' }
		})

		if (!rank)
			rank = {
				id: "custom",
				en_label: "cabin boy",
				fr_label: "mousse",
				min: -99999999999
			}

		res.json({ ok: true, rank })
	} catch (error) {
		console.error("get-user-rank error:", error)
		res.status(500).json({ ok: false })
	}
}