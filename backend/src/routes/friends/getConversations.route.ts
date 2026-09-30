import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import { prisma } from "../../db/client.ts";
import type { ConversationSummary } from "../../events.ts";

export async function getConverstionsHandler(req: Request, res: Response) {
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
					{ userId },
					{ targetId: userId }
				]
			},
			orderBy: { sendAt: "desc" },
			include: {
				user: { select: { id: true, username: true, image: true } },
				target: { select: { id: true, username: true, image: true } },
			}
		})

		const conversations = new Map<string, ConversationSummary>()

		for (const row of rows) {
			const other = row.userId === userId ? row.target : row.user
			const peerId = other.id

			if (!conversations.has(peerId)) {
				conversations.set(peerId, {
					peerId,
					username: other.username,
					image: other.image,
					lastMessage: row.message,
					lastAt: row.sendAt.toISOString(),
					isMine: row.userId === userId,
					unreadCount: 0
				})
			}

			if (row.targetId === userId && !row.isRead) {
				const conv = conversations.get(peerId)!
				conv.unreadCount++
			}

		}

		const result = Array.from(conversations.values())
		res.json({ conversations: result })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}