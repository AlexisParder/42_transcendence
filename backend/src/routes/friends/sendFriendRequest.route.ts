import type { Request, Response } from "express"
import { auth } from "../../auth.ts"
import { fromNodeHeaders } from "better-auth/node"
import { prisma } from "../../db/client.ts"
import type {Server} from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../../events.ts"
import { notify } from "../../lib/notify.ts"

export async function sendFriendRequestHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const { username } = req.body

		const target = await prisma.user.findUnique({
			where: { username },
			select: { id: true }
		})

		if (!target)
			return res.status(404).json({ ok: false, error: "friend_err_user_not_found" })

		if (target.id === userId)
			return res.status(400).json({ ok: false, error: "friend_err_user_self" })

		const block = await prisma.userBlocked.findFirst({
			where: {
				OR: [
					{ userId, targetId: target.id },
					{ userId: target.id, targetId: userId },
				]
			}
		})

		if (block)
			return res.status(403).json({ ok: false, error: block.userId === userId ? "friend_block_err_blocked" : "friend_err_user_not_found" })

		const existing = await prisma.friends.findFirst({
			where: {
				OR: [
					{ userId, targetId: target.id },
					{ userId: target.id, targetId: userId },
				]
			}
		})

		if (existing)
			return res.status(409).json({ ok: false, error: existing.isAccepted ? "friend_err_user_aready_friends" : "friend_err_user_already_pending" })

		const request = await prisma.friends.create({
			data: {
				userId,
				targetId: target.id,
				isAccepted: false
			}
		})

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		io.to(target.id).emit("friend_request_received", {
			id: request.id,
			fromUserId: userId,
			username: session.user.username,
			image: session.user.image
		})

		void notify(io, {
			userId: target.id,
			fromUserId: userId,
			title: "notifications_friend_request",
			description: "notifications_friend_request_message",
			save: true,
			category: "friend",
			requestId: request.id,
		})
		res.json({ ok: true, request })
	} catch (error) {
		res.status(500).json({ ok: false })
	}
}
