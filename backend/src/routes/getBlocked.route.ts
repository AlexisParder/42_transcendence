import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import type { Friend } from "../events.ts";

export async function getBlockedHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const rows = await prisma.userBlocked.findMany({
			where: { userId },
			include: {
				target: { select: { id: true, username: true, image: true } }
			}
		})

		const blocked: Friend[] = rows.map(row => ({
			id: row.target.id,
			username: row.target.username,
			image: row.target.image,
			status: "offline"
		}))

		res.json({ ok: true, blocked })
	} catch (error) {
		console.error("get-blocked error:", error)
		res.status(500).json({ ok: false })
	}
}