import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts";
import type { Matchs, vect2 } from "../../events.ts";
import { isExpired, isTeamEliminated } from "../../lib/matchs/matchUtils.ts";
import { fireShot } from "../../lib/matchs/fireShot.ts";
import { io } from "../../server.ts";

const sameCoords = (a: vect2, b: vect2) => a.x === b.x && a.y === b.y
const isValidCell = (c: any): c is vect2 => c && Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= 0 && c.x < 14 && c.y >= 0 && c.y < 14

export async function playerFireHandler(req: Request, res: Response) {
	const { hostId, coords, targetTeamId }: {
		hostId: string,
		coords: vect2,
		targetTeamId: number,
	} = req.body ?? {}

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

		if (!isValidCell(coords) || !Number.isInteger(targetTeamId))
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		const match = currentMatches.get(hostId)
		if (!match)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		const player = match.players.find(p => p.userId === userId)
		if (!player)
			return res.status(403).json({ ok: false, code: "match_err_no_match" })

		if (player.team === targetTeamId)
			return res.status(400).json({ ok: false, code: "match_err_own_team" })

		if (match.startedAt === 0)
			return res.status(403).json({ ok: false, code: "match_err_not_started" })

		if (match.turns.userTurn !== userId)
			return res.status(400).json({ ok: false, code: "match_err_not_your_turn" })

		if (isTeamEliminated(match, player.team))
			return res.status(400).json({ ok: false, code: "match_err_you_eliminated" })

		if (isExpired(match.turns.timerStart, match.settings.time_turn * 1000))
			return res.status(400).json({ ok: false, code: "match_err_time_expired" })

		const team = match.teams.find(t => t.id === targetTeamId)
		if (!team)
			return res.status(400).json({ ok: false, code: "match_err_team_does_not_exist" })

		if (isTeamEliminated(match, targetTeamId))
			return res.status(400).json({ ok: false, code: "match_err_team_eliminated" })

		if (team.shots.some(s => sameCoords(s.coords, coords)))
			return res.status(400).json({ ok: false, code: "match_err_cell_already_shot" })

		fireShot(match, player, team, coords, io)

		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}