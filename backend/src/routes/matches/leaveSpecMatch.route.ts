import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs, PresenceStatus } from "../../events.ts";
import { filterMatchForUser } from "../../lib/matchs/matchUtils.ts";
import { io } from "../../server.ts";
import { notifyFriendsOfPresence } from "../../index.ts";

export async function leaveSpecMatchHandler(req: Request, res: Response) {
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

		if (!match.spectators.some(p => p === userId))
			return res.status(409).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt === 0)
			return res.status(403).json({ ok: false, code: "match_err_not_started" })

		if (userId === hostId)
			return res.json({ ok: false, code: "match_err_must_close" })

		match.spectators = match.spectators.filter(p => p !== userId)

		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}
		for (const spectator of match.spectators) {
			if (spectator)
				io.to(spectator).emit("refresh_joined_match", filterMatchForUser(match, spectator))
		}

		io.to(userId).emit("refresh_joined_match", undefined)

		const activityStatus = req.app.get("activityStatus") as Map<string, PresenceStatus>
		activityStatus.set(userId, "available")
		await notifyFriendsOfPresence(userId, "available")
		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}