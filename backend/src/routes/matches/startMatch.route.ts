import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { countTeamPlayers, updatePlayer } from "../../lib/matchs/matchUtils.ts";
import { buildTurnOrder } from "../../lib/matchs/playerOrder.ts";
import { startTurnTimer } from "../../lib/matchs/turnTimer.ts";
import { io } from "../../server.ts";

export async function startMatchHandler(req: Request, res: Response) {
	const { hostId } = req.body ?? {}

	if (!isString(hostId))
		return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

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
			return res.status(403).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt !== 0)
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (match.hostId !== userId)
			return res.status(400).json({ ok: false, code: "match_err_host" })

		if (match.players.length !== match.maxPlayers)
			return res.status(400).json({ ok: false, code: "match_err_not_full" })

		for (const team of match.teams) {
			if (countTeamPlayers(match.players, team.id) === 0)
				return res.status(400).json({ ok: false, code: "match_err_not_full" })
		}

		if (match.players.some(p => !p.isReady))
			return res.status(400).json({ ok: false, code: "match_err_all_players_not_ready" })

		match.code = ""

		match.players.map(p => {
			if (p.userId)
				updatePlayer(match, p.userId, { isReady: false })
		})

		const turnOrder: string[] = buildTurnOrder(match.players, match.type === "TWO_V_TWO")
		match.turns.turnOrder = turnOrder
		match.turns.userTurn = turnOrder[0] ?? null

		match.startedAt = Date.now()
		match.turns.timerStart = match.startedAt

		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("start_match")
		}
		startTurnTimer(match, io)

		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}