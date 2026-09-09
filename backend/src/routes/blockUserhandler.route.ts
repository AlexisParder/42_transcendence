import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../events.ts";
import type { Server } from "socket.io";

export async function blockUserHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const { targetId } = req.body

		if (!targetId)
			return res.status(400).json({ ok: false, error: 'friend_block_err_invalid' })
		if (targetId === userId)
			return res.status(400).json({ ok: false, error: 'friend_block_err_self' })

		const already = await prisma.userBlocked.findFirst({
			where: { userId, targetId }
		})
		if (already)
			return res.status(409).json({ ok: false, error: 'friend_block_err_already' })

		await prisma.$transaction([
			prisma.userBlocked.create({
				data: { userId, targetId }
			}),
			prisma.friends.deleteMany({
				where: {
					OR: [
						{ userId, targetId },
						{ userId: targetId, targetId: userId }
					]
				}
			})
		])

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		io.to(targetId).emit("friend_removed", { userId })
		res.json({ ok: true })
	} catch (error) {
		console.error("block error:", error)
		res.status(500).json({ ok: false })
	}
}