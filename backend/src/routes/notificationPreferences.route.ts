import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"
import { defaultNotificationPreferences, parseNotificationPreferences } from "../lib/notificationPreferences.ts"

export async function notificationPreferencesHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
		if (!session) return res.status(401).json({ ok: false })
		const userId = session.user.id
		if (req.method === "GET") {
			const preferences = await prisma.notificationPreferences.findUnique({ where: { userId } })
			return res.json({ preferences: preferences ?? defaultNotificationPreferences })
		}
		const update = parseNotificationPreferences(req.body)
		if (!update) return res.status(400).json({ ok: false, error: "Invalid notification preferences" })
		const preferences = await prisma.notificationPreferences.upsert({
			where: { userId },
			create: { userId, ...update },
			update,
		})
		return res.json({ preferences })
	} catch (error) {
		console.error("notification preferences error:", error)
		return res.status(500).json({ ok: false })
	}
}
