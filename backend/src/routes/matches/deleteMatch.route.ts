import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import type { Server } from "socket.io";

export async function deleteMatchHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		const match = currentMatches.get(userId)
		if (!match)
			return res.status(400).json({ ok: false, code: "host_err_no_match" })

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId && player.userId !== userId)
				io.to(player.userId).emit("refresh_joined_match", undefined)
		}

		currentMatches.delete(userId)
		res.json({ ok: true })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}