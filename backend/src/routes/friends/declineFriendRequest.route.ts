import type { Request, Response } from "express"
import { auth } from "../../auth.ts"
import { fromNodeHeaders } from "better-auth/node"
import { prisma } from "../../db/client.ts"
import { io } from "../../server.ts"

export async function declineFriendRequestHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const { requestId } = req.body

		if (typeof requestId !== "string")
			return res.status(400).json({ ok: false, error: "friend_err_user_not_found" })

		const request = await prisma.friends.findUnique({
			where: { id: requestId }
		})

		if (!request)
			return res.status(404).json({ ok: false, error: "friend_err_user_not_found" })

		if (request.targetId !== userId)
			return res.status(403).json({ ok: false, error: "friend_err_forbidden" })

		const deleted = await prisma.friends.deleteMany({
			where: { id: requestId, targetId: userId, isAccepted: false }
		})
		if (deleted.count === 0)
			return res.status(409).json({ ok: false, error: "friend_err_user_aready_friends" })

		io.to(userId).emit("friend_request_resolved", { requestId, accepted: false })

		res.json({ ok: true })
	} catch (error) {
		res.status(500).json({ ok: false })
	}
}
