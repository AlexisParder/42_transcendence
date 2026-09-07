import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import type { FriendRequest } from "../events.ts";

export async function getFriendsPendingHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const rows = await prisma.friends.findMany({
			where: { targetId: userId, isAccepted: false },
			include: {
				user: { select: { id: true, username: true, image: true } },
			}
		})

		const requests: FriendRequest[] = rows.map(row => {
			return {
				id: row.id,
				fromUserId: row.user.id,
				username: row.user.username,
				image: row.user.image,
			}
		})
		res.json({ requests })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}