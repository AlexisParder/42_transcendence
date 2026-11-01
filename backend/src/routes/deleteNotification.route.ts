import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"

export async function deleteNotificationHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const { notificationId } = req.body

		if (typeof notificationId !== "string")
			return res.status(400).json({ ok: false })
		const result = await prisma.notification.deleteMany({
			where: {
				id: notificationId,
				userId: session.user.id
			}
		})

		if (result.count === 0)
			return res.status(404).json({ ok: false })

		res.json({ ok: true })
	} catch (error) {
		console.error("delete notification error:", error)
		res.status(500).json({ ok: false })
	}
}
