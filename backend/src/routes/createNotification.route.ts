import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"

function isValidText(value: unknown, max: number): value is string {
	return typeof value === "string" && value.trim().length > 0 && value.length <= max
}

function isValidParams(params: unknown) {
	if (params === undefined)
		return true
	if (!params || typeof params !== "object" || Array.isArray(params))
		return false
	return Object.values(params).every(value =>
		(typeof value === "string" && value.length <= 500) || typeof value === "number"
	)
}

export async function createNotificationHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const { title, description, params } = req.body

		if (!isValidText(title, 100) || !isValidText(description, 500) || !isValidParams(params))
			return res.status(400).json({ ok: false })

		const notification = await prisma.notification.create({
			data: {
				userId: session.user.id,
				title,
				description,
				params
			}
		})

		res.json({ ok: true, notification })
	} catch (error) {
		console.error("create notification error:", error)
		res.status(500).json({ ok: false })
	}
}
