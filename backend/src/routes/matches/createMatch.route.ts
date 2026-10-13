import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { filterMatchForUser, generateCode, isInAnyMatch, isMatchType, MATCH_CONFIG } from "../../lib/matchs/matchUtils.ts";

export async function createMatchHandler(req: Request, res: Response) {
	const { selectedMatchType, visibility, timeTurn, replace, spectators } = req.body
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

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
				replace,
				spectators
			},
			code,
			step: "deploy",
			visibility,
			isRanked: selectedMatchType !== "BOT" && !replace,
			startedAt: 0,
			endedAt: 0,
			hostId: userId,
			maxPlayers: MATCH_CONFIG[selectedMatchType].maxPlayers,
			invitedPlayers: [],
			turns: {
				timerStart: 0,
				userTurn: null,
				isBotTurn: false,
				turnOrder: []
			},
			teams: Array.from({ length: MATCH_CONFIG[selectedMatchType].teams }, (_, i) => ({
				id: i + 1,
				ships: [],
				// ships: [
				// 	// TESTS
				// 	{ name: "carrier", start: { x: 0, y: i }, end: { x: 4, y: i }, size: 5, image: "" },
				// 	{ name: "frigate", start: { x: 0, y: i + 2 }, end: { x: 3, y: i + 2 }, size: 4, image: "" },
				// 	{ name: "cruiser", start: { x: 6, y: i }, end: { x: 6, y: i + 2 }, size: 3, image: "" },
				// 	{ name: "submarine", start: { x: 8, y: i + 4 }, end: { x: 8, y: i + 6 }, size: 3, image: "" },
				// 	{ name: "destroyer", start: { x: i, y: 8 }, end: { x: i + 1, y: 8 }, size: 2, image: "" },
				// ],
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
					placement: 0,
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