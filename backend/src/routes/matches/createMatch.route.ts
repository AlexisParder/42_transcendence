import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { filterMatchForUser, generateCode, isInAnyMatch, isMatchType, MATCH_CONFIG } from "../../lib/matchs/matchUtils.ts";

export async function createMatchHandler(req: Request, res: Response) {
	const { selectedMatchType, visibility, timeTurn, abilities, replace, spectators } = req.body
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(405).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		if (isInAnyMatch(currentMatches, userId))
			return res.status(409).json({ ok: false, code: "match_err_already_in_match" })

		if (!isMatchType(selectedMatchType))
			return res.status(400).json({ ok: false })

		const code = generateCode(currentMatches)
		const newMatch: Matchs = {
			type: selectedMatchType,
			settings: {
				time_turn: timeTurn,
				abilities,
				replace,
				spectators
			},
			code,
			visibility,
			isRanked: selectedMatchType !== "BOT" && !replace,
			startedAt: "",
			endedAt: "",
			hostId: userId,
			maxPlayers: MATCH_CONFIG[selectedMatchType].maxPlayers,
			invitedPlayers: [],
			teams: Array.from({ length: MATCH_CONFIG[selectedMatchType].teams }, (_, i) => ({
				idTeam: i + 1,
				ships: [],
				shots: []
			})),
			players: [
				{
					userId,
					username: session.user.username,
					image: session.user.image,
					isReady: true,
					isBot: false,
					team: 1,
					placement: 1,
					points: session.user.points ?? 0,
					leftAt: null,
					status: "PLAYED",
					shotsHit: 0,
					shotsTotal: 0
				}
			]
		}

		currentMatches.set(userId, newMatch)
		res.json({ ok: true, match: filterMatchForUser(newMatch, userId) })
	} catch (err) {
		console.log(err)
		res.status(500).json({ ok: false })
	}
}