import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../db/client.ts";

export async function setReadHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const { peerId } = req.body

		await prisma.conversations.updateMany({
			where: {
				userId: peerId,
				targetId: userId,
				isRead: false
			},
			data: { isRead: true }
		})

		res.json({ ok: true })
	} catch (error) {
		console.error("setRead error:", error)
		res.status(500).json({ ok: false })
	}
}