import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import type { Server } from "socket.io"

export async function setPlayerShipsHandler(req: Request, res: Response) {
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

		if (match.players.some(p => p.isReady))
			return res.status(400).json({ ok: false, code: "match_err_all_players_not_ready" })

		console.log("Team Id: ", player.team)
		match.teams[player.team - 1].ships = [
			{ name: "carrier", start: { x: 0, y: 1 }, end: { x: 4, y: 1 }, size: 5, image: "" },
			{ name: "frigate", start: { x: 0, y: 3 }, end: { x: 3, y: 3 }, size: 4, image: "" },
			{ name: "cruiser", start: { x: 6, y: 1 }, end: { x: 6, y: 3 }, size: 3, image: "" },
			{ name: "submarine", start: { x: 8, y: 5 }, end: { x: 8, y: 7 }, size: 3, image: "" },
			{ name: "destroyer", start: { x: 1, y: 8 }, end: { x: 2, y: 8 }, size: 2, image: "" },
		]

		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}