import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"
import { defaultNotificationPreferences, parseNotificationPreferences } from "../lib/notificationPreferences.ts"

export async function getNotificationPreferencesHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const preferences = await prisma.notificationPreferences.findUnique({
			where: { userId: session.user.id }
		})

		res.json({ ok: true, preferences: preferences ?? defaultNotificationPreferences })
	} catch (error) {
		console.error("get notification preferences error:", error)
		res.status(500).json({ ok: false })
	}
}

export async function setNotificationPreferencesHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const update = parseNotificationPreferences(req.body)

		if (!update)
			return res.status(400).json({ ok: false })

		const userId = session.user.id
		const preferences = await prisma.notificationPreferences.upsert({
			where: { userId },
			create: { userId, ...update },
			update
		})

		res.json({ ok: true, preferences })
	} catch (error) {
		console.error("set notification preferences error:", error)
		res.status(500).json({ ok: false })
	}
}
