import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import type { Friend } from "../events.ts";

export async function getFriendsHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const rows = await prisma.friends.findMany({
			where: {
				isAccepted: true,
				OR: [
					{ userId },
					{ targetId: userId }
				]
			},
			include: {
				user: { select: { id: true, username: true, image: true } },
				target: { select: { id: true, username: true, image: true } },
			}
		})

		const onlineUsers = req.app.get("onlineUsers") as Map<string, number>
		const activityStatus = req.app.get("activityStatus") as Map<string, "available" | "away">

		function effectiveStatus(id: string): "available" | "away" | "offline" {
			if (!onlineUsers.has(id))
				return "offline"
			return activityStatus.get(id) ?? "available"
		}

		const friends: Friend[] = rows.map(row => {
			const friend = row.userId === userId ? row.target : row.user
			return {
				id: friend.id,
				username: friend.username,
				image: friend.image,
				status: effectiveStatus(friend.id)
			}
		})
		res.json({ friends })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}