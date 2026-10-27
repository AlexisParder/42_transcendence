import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { filterMatchForUser } from "../../lib/matchs/matchUtils.ts";
import { io } from "../../server.ts";

export async function leaveMatchHandler(req: Request, res: Response) {
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

		if (!match.players.some(p => p.userId === userId))
			return res.status(409).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt !== 0)
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (userId === hostId)
			return res.json({ ok: false, code: "match_err_must_close" })

		match.players = match.players.filter(p => p.userId !== userId)

		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}

		res.json({ ok: true, match: filterMatchForUser(match, userId) })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}