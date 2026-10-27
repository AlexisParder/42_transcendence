import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { filterMatchForUser, updatePlayer } from "../../lib/matchs/matchUtils.ts";
import { endDeploy } from "../../lib/matchs/turnTimer.ts";
import { SHIP_COUNT, validateShips } from "../../lib/matchs/shipValidation.ts";
import { io } from "../../server.ts";

export async function setPlayerShipsHandler(req: Request, res: Response) {
	const { ships } = req.body

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

		if (match.startedAt == 0 || match.step !== "deploy")
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (player.isReady)
			return res.status(400).json({ ok: false, code: "match_err_already_ready" })

		const validShips = validateShips(ships)
		if (!validShips)
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		match.teams[player.team - 1].ships = validShips
		for (const p of match.players) {
			if (p.userId && p.status !== "LEFT")
				io.to(p.userId).emit("refresh_joined_match", filterMatchForUser(match, p.userId))
		}

		res.json({ ok: true, match: filterMatchForUser(match, session.user.id) })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}

export async function setPlayerReadyOnSelectHandler(req: Request, res: Response) {
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

		if (match.startedAt == 0 || match.step !== "deploy")
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (player.isReady)
			return res.status(400).json({ ok: false, code: "match_err_already_ready" })

		if (match.teams[player.team - 1].ships.length !== SHIP_COUNT)
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		updatePlayer(match, session.user.id, { isReady: true })

		for (const p of match.players) {
			if (p.userId)
				io.to(p.userId).emit("refresh_joined_match", filterMatchForUser(match, p.userId))
		}

		if (match.players.every(p => p.isReady || p.isBot))
			endDeploy(match, io)

		res.json({ ok: true, match: filterMatchForUser(match, session.user.id) })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}