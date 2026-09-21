import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"

export async function deleteAllNotificationsHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const result = await prisma.notification.deleteMany({
			where: { userId: session.user.id }
		})

		res.json({ ok: true, count: result.count })
	} catch (error) {
		console.error("delete all notifications error:", error)
		res.status(500).json({ ok: false })
	}
}
