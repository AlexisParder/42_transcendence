import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, MatchPlayers, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { updatePlayer } from "../../lib/matchUtils.ts";
import type { Server } from "socket.io"

export async function updatePlayerStatusMatchHandler(req: Request, res: Response) {
	const { hostId } = req.body
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		const match = currentMatches.get(hostId)
		if (!match)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		const player = match.players.find(p => p.userId === userId)
		if (!player)
			return res.status(409).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt !== "")
			return res.status(400).json({ ok: false, code: "match_err_already_started" })

		updatePlayer(match, userId, { isReady: !player.isReady })

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId && player.userId !== userId)
				io.to(player.userId).emit("refresh_joined_match", match)
		}

		res.json({ ok: true, match })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}