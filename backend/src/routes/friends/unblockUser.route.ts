import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts";
import { prisma } from "../../db/client.ts";

export async function unblockUserHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const { targetId } = req.body ?? {}

		if (!isString(targetId))
			return res.status(400).json({ ok: false, error: 'friend_block_err_invalid' })
		if (targetId === userId)
			return res.status(400).json({ ok: false, error: 'friend_unblock_err_self' })

		await prisma.userBlocked.deleteMany({
			where: { userId, targetId }
		})

		res.json({ ok: true })
	} catch (error) {
		console.error("block error:", error)
		res.status(500).json({ ok: false })
	}
}