import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs, PresenceStatus } from "../../events.ts";
import { io } from "../../server.ts";
import { notifyFriendsOfPresence } from "../../index.ts";

export async function deleteMatchHandler(req: Request, res: Response) {
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
			return res.status(400).json({ ok: false, code: "match_err_no_match" })

		if (match.hostId !== userId)
			return res.status(400).json({ ok: false, code: "match_err_host" })

		if (match.startedAt !== 0)
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", undefined)
		}

		currentMatches.delete(userId)

		const activityStatus = req.app.get("activityStatus") as Map<string, PresenceStatus>
		activityStatus.set(userId, "available")
		await notifyFriendsOfPresence(userId, "available")
		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}