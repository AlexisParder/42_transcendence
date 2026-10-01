import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../../auth.ts"
import type { Request, Response } from "express"
import { prisma } from "../../db/client.ts"
import type { Message } from "../../events.ts"

export async function getConvHistoryHandler(req: Request, res: Response) {
	const { peerId, before } = req.body

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const rows = await prisma.conversations.findMany({
			where: {
				OR: [
					{ userId, targetId: peerId },
					{ userId: peerId, targetId: userId }
				],
				...(before ? { sendAt: { lt: new Date(before) } } : {})
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
			createdAt: row.sendAt.toISOString(),
			isRead: row.isRead
		}))
		res.json({ messages })
	} catch (error) {
		res.status(401).json({ ok: false })
	}
}