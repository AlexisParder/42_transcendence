import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"

export async function setNotificationReadHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const { notificationId } = req.body

		const result = await prisma.notification.updateMany({
			where: {
				id: notificationId,
				userId: session.user.id,
				read: false
			},
			data: { read: true }
		})

		if (result.count === 0)
			return res.status(404).json({ ok: false })

		res.json({ ok: true })
	} catch (error) {
		console.error("set notification read error:", error)
		res.status(500).json({ ok: false })
	}
}
