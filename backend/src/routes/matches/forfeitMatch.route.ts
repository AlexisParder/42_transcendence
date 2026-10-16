import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import type { Server } from "socket.io"
import { markPlayerLeft } from "../../lib/matchs/turnTimer.ts";

export async function forfeitMatchHandler(req: Request, res: Response) {
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

		if (match.startedAt === 0)
			return res.status(400).json({ ok: false, code: "match_err_not_started" })

		if (match.endedAt !== 0)
			return res.status(400).json({ ok: false, code: "match_err_already_ended" })

		if (player.status === "LEFT")
			return res.status(400).json({ ok: false, code: "match_err_player_already_left" })

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

		markPlayerLeft(match, userId, io)

		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}