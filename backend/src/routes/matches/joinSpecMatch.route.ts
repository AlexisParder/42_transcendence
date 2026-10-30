import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs, PresenceStatus } from "../../events.ts";
import { filterMatchForUser, isInAnyMatch, isInAnySpecMatch } from "../../lib/matchs/matchUtils.ts";
import { prisma } from "../../db/client.ts";
import { io } from "../../server.ts";
import { notifyFriendsOfPresence } from "../../index.ts";

export async function joinSpecMatchHandler(req: Request, res: Response) {
	const { hostId } = req.body
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>
		const data = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { points: true }
		})

		if (!data)
			return res.status(400).json({ ok: false })

		const match = currentMatches.get(hostId)
		if (!match || match.visibility !== "public" || !match.settings.spectators)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		if (isInAnyMatch(currentMatches, userId) || isInAnySpecMatch(currentMatches, userId))
			return res.status(409).json({ ok: false, code: "match_err_already_in_match" })

		if (match.startedAt === 0)
			return res.status(400).json({ ok: false, code: "match_err_not_started" })

		match.spectators.push(userId)

		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}
		for (const spectator of match.spectators) {
			if (spectator)
				io.to(spectator).emit("refresh_joined_match", filterMatchForUser(match, spectator))
		}

		const activityStatus = req.app.get("activityStatus") as Map<string, PresenceStatus>
		activityStatus.set(userId, "in a match")
		await notifyFriendsOfPresence(userId, "in a match")
		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}