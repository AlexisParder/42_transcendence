import type { Request, Response } from "express"
import { auth } from "../../auth.ts"
import { fromNodeHeaders } from "better-auth/node"
import { prisma } from "../../db/client.ts"
import type { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../../events.ts"

export async function acceptFriendRequestHandler(req: Request, res: Response) {
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
			return res.status(404).json({ ok: false, error: "friend_err_user_not_found" })

		if (request.targetId !== userId)
			return res.status(403).json({ ok: false, error: "friend_err_forbidden" })

		if (request.isAccepted)
			return res.status(409).json({ ok: false, error: "friend_err_user_aready_friends" })

		await prisma.friends.update({
			where: { id: requestId },
			data: { isAccepted: true }
		})

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		io.to(request.userId).emit("friend_request_accepted", {
			friendId: userId,
			username: session.user.username,
			image: session.user.image,
		})
		io.to(userId).emit("friend_request_resolved", { requestId, accepted: true })

		res.json({ ok: true })
	} catch (error) {
		res.status(500).json({ ok: false })
	}
}
