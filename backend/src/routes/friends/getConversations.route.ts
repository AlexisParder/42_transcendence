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
			orderBy: { sendAt: "desc" }
		})

		const peerIds = [...new Set(rows.map(row => row.userId === userId ? row.targetId : row.userId))]
		const peers = await prisma.user.findMany({
			where: { id: { in: peerIds } },
			select: { id: true, username: true, image: true }
		})
		const peersById = new Map(peers.map(peer => [peer.id, peer]))

		const conversations = new Map<string, ConversationSummary>()

		for (const row of rows) {
			const peerId = row.userId === userId ? row.targetId : row.userId
			const other = peersById.get(peerId)

			if (!conversations.has(peerId)) {
				conversations.set(peerId, {
					peerId,
					username: other?.username,
					image: other?.image,
					isDeleted: !other,
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