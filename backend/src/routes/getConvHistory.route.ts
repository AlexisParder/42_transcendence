import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type { Request, Response } from "express"
import { prisma } from "../db/client.ts"
import type { Message } from "../events.ts"

export async function getConvHistoryHandler(req: Request, res: Response) {
	const { peerId } = req.body
	console.log("[history] peerId recu:", peerId)
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})
		console.log("[history] session:", session ? session.user.id : "AUCUNE")

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const rows = await prisma.conversations.findMany({
			where: {
				OR: [
					{ userId, targetId: peerId },
					{ userId: peerId, targetId: userId }
				]
			},
			orderBy: { sendAt: "desc" },
			take: 50
		})

		rows.reverse()

		const messages: Message[] = rows.map(row => ({
			id: row.id,
			fromUserId: row.userId,
			toUserId: row.targetId,
			message: row.message,
			createdAt: row.sendAt.toISOString()
		}))
		res.json({ messages })
	} catch (error) {
		res.status(401).json({ ok: false })
	}
}