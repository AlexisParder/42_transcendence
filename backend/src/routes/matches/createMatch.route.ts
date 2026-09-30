import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { isInAnyMatch } from "../../lib/matchUtils.ts";

export async function createMatchHandler(req: Request, res: Response) {
	const { selectedMatchType, visibility, code, timeTurn, abilities, replace, spectators } = req.body
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		if (isInAnyMatch(currentMatches, userId))
			return res.status(409).json({ ok: false, code: "already_in_match" })

		const newMatch: Matchs = {
			mode: selectedMatchType,
			settings: {
				time_turn: timeTurn,
				abilities,
				replace,
				spectators
			},
			code,
			visibility,
			isRanked: selectedMatchType !== "BOT",
			startedAt: "",
			endedAt: "",
			hostId: userId,
			maxPlayers: (selectedMatchType === "ONE_V_ONE" || selectedMatchType === "BOT") ? 2 : 4,
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
		res.json({ ok: true, match: newMatch })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}