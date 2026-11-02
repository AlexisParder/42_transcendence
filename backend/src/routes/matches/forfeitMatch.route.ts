import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts";
import type { Matchs, PresenceStatus } from "../../events.ts";
import { markPlayerLeft } from "../../lib/matchs/turnTimer.ts";
import { io } from "../../server.ts";
import { notifyFriendsOfPresence } from "../../index.ts";

export async function forfeitMatchHandler(req: Request, res: Response) {
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
			return res.status(409).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt === 0)
			return res.status(400).json({ ok: false, code: "match_err_not_started" })

		if (match.endedAt !== 0)
			return res.status(400).json({ ok: false, code: "match_err_already_ended" })

		if (player.status === "LEFT")
			return res.status(400).json({ ok: false, code: "match_err_player_already_left" })


		markPlayerLeft(match, userId, io)

		const activityStatus = req.app.get("activityStatus") as Map<string, PresenceStatus>
		activityStatus.set(userId, "available")
		await notifyFriendsOfPresence(userId, "available")
		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}