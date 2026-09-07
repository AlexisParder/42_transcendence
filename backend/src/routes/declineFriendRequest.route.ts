import type { Request, Response } from "express"
import { auth } from "../auth.ts"
import { fromNodeHeaders } from "better-auth/node"
import { prisma } from "../db/client.ts"

export async function declineFriendRequestHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const { requestId } = req.body

		const request = await prisma.friends.findUnique({
			where: { id: requestId }
		})

		if (!request)
			return res.status(404).json({ ok: false, error: "friend_req_not_found" })

		if (request.targetId !== userId)
			return res.status(403).json({ ok: false, error: "friend_req_forbidden" })

		await prisma.friends.delete({
			where: { id: requestId }
		})

		res.json({ ok: true })
	} catch (error) {
		res.status(500).json({ ok: false })
	}
}