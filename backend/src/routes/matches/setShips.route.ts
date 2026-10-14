import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, Ship, SocketData } from "../../events.ts";
import type { Server } from "socket.io"
import { filterMatchForUser, updatePlayer } from "../../lib/matchs/matchUtils.ts";

export async function setPlayerShipsHandler(req: Request, res: Response) {
	const { ships }: { ships: Ship[] } = req.body

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>
		const matches = Array.from(currentMatches.values())

		let match = null

		for (const m of matches) {
			if (m.players.some(p => p.userId === session.user.id)) {
				match = m
				break
			}
		}

		if (!match)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		const player = match.players.find(p => p.userId === session.user.id)
		if (!player)
			return res.status(403).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt == 0)
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (player.isReady)
			return res.status(400).json({ ok: false, code: "match_err_already_ready" })

		match.teams[player.team - 1].ships = ships
		updatePlayer(match, session.user.id, { isReady: true })

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const p of match.players) {
			if (p.userId)
				io.to(p.userId).emit("refresh_joined_match", filterMatchForUser(match, p.userId))
		}

		res.json({ ok: true, match: filterMatchForUser(match, session.user.id) })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}