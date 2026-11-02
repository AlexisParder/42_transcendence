import type { Request, Response } from "express"
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts"
import { fromNodeHeaders } from "better-auth/node"
import { prisma } from "../../db/client.ts"
import { notify } from "../../lib/notify.ts"
import { io } from "../../server.ts"

export async function sendFriendRequestHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const { username } = req.body ?? {}

		if (!isString(username))
			return res.status(400).json({ ok: false, error: "friend_err_user_not_found" })

		const target = await prisma.user.findUnique({
			where: { username: username.trim().toLowerCase() },
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

		// si A et B s'envoient une demande en même temps, on ne garde que celle de l'id le plus petit
		const pair = await prisma.friends.findMany({
			where: {
				OR: [
					{ userId, targetId: target.id },
					{ userId: target.id, targetId: userId },
				]
			}
		})
		if (pair.length > 1) {
			const keptSender = userId < target.id ? userId : target.id
			const removedSender = keptSender === userId ? target.id : userId
			await prisma.friends.deleteMany({ where: { userId: removedSender, targetId: keptSender } })
			if (removedSender === userId)
				return res.status(409).json({ ok: false, error: "friend_err_user_already_pending" })
		}

		io.to(target.id).emit("friend_request_received", {
			id: request.id,
			fromUserId: userId,
			username: session.user.username,
			image: session.user.image
		})

		void notify({
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
		if ((error as { code?: string }).code === "P2002")
			return res.status(409).json({ ok: false, error: "friend_err_user_already_pending" })
		res.status(500).json({ ok: false })
	}
}
