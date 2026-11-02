import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";
import { filterMatchForUser } from "../../lib/matchs/matchUtils.ts";
import { io } from "../../server.ts";

export async function matchSendMessageHandler(req: Request, res: Response) {
	const { hostId, message } = req.body ?? {}

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

		if (match.type !== "TWO_V_TWO")
			return res.status(400).json({ ok: false })

		if (match.startedAt === 0)
			return res.status(403).json({ ok: false, code: "match_err_not_started" })

		const team = match.teams.find(t => t.id === player.team)
		if (!team)
			return res.status(400).json({ ok: false, code: "match_err_team_does_not_exist" })

		if (typeof message !== "string")
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		if (message.length < 1)
			return res.status(400).json({ ok: false, code: "match_err_msg_to_short" })

		if (message.length > 1000)
			return res.status(400).json({ ok: false, code: "friend_err_msg_to_long" })

		team.chat.push({
			authorId: userId,
			message
		})

		for (const p of match.players) {
			if (p.userId && p.team === team.id)
				io.to(p.userId).emit("refresh_chat_match", filterMatchForUser(match, p.userId))
		}

		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}