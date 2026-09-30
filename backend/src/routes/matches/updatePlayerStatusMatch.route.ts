import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { MatchPlayers, Matchs } from "../../events.ts";
import { updatePlayer } from "../../lib/matchUtils.ts";

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
			return res.status(400).json({ ok: false, code: "match_does_not_exist" })

		const player = match.players.find(p => p.userId === userId)
		if (!player)
			return res.status(409).json({ ok: false, code: "not_in_match" })

		if (match.startedAt !== "")
			return res.status(400).json({ ok: false, code: "match_already_started" })

		updatePlayer(match, userId, { isReady: !player.isReady })
		res.json({ ok: true, match })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}