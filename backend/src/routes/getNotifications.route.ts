import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"
import { withUsername } from "../lib/notify.ts"
import type { NotificationParams } from "../events.ts"

export async function getNotificationsHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const notifications = await prisma.notification.findMany({
			where: {
				userId: session.user.id
			},
			orderBy: {
				createdAt: "desc"
			},
			take: 50,
			include: {
				fromUser: { select: { username: true } }
			}
		})

		res.json({
			notifications: notifications.map(({ fromUser, ...notification }) => ({
				...notification,
				params: notification.fromUserId
					? withUsername((notification.params ?? undefined) as NotificationParams | undefined, fromUser?.username)
					: notification.params
			}))
		})
	} catch (error) {
		console.error("get notifications error:", error)
		res.status(500).json({ ok: false })
	}
}