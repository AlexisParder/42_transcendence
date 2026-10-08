import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import type { Server } from "socket.io"
import { filterMatchForUser } from "../../lib/matchs/matchUtils.ts";

export async function kickPlayerMatchHandler(req: Request, res: Response) {
	const { targetId } = req.body
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
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		if (userId !== match.hostId)
			return res.status(400).json({ ok: false, code: "match_err_host" })

		if (!match.players.some(p => p.userId === targetId))
			return res.status(409).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt !== "")
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (userId === targetId)
			return res.json({ ok: false, code: "match_err_kick_self" })

		match.players = match.players.filter(p => p.userId !== targetId)

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId && player.userId !== userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}

		io.to(targetId).emit("refresh_joined_match", undefined)

		res.json({ ok: true, match: filterMatchForUser(match, userId) })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}