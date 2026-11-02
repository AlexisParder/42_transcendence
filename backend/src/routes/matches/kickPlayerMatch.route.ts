import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { filterMatchForUser } from "../../lib/matchs/matchUtils.ts";
import { io } from "../../server.ts";
import { setAvailable } from "../../index.ts";

export async function kickPlayerMatchHandler(req: Request, res: Response) {
	const { targetId } = req.body ?? {}

	if (!isString(targetId))
		return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		const match = currentMatches.get(userId)
		if (!match)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		if (!match.players.some(p => p.userId === targetId))
			return res.status(409).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt !== 0)
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (userId === targetId)
			return res.status(400).json({ ok: false, code: "match_err_kick_self" })

		if (match.players.some(p => p.userId === targetId && p.isBot))
			return res.status(400).json({ ok: false, code: "match_err_kick_failure" })

		match.players = match.players.filter(p => p.userId !== targetId)

		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}

		io.to(targetId).emit("refresh_joined_match", undefined)

		await setAvailable(targetId)
		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}