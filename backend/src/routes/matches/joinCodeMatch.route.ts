import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { isString } from "../../lib/validate.ts"
import { auth } from "../../auth.ts";
import type { MatchPlayers, Matchs, PresenceStatus } from "../../events.ts";
import { filterMatchForUser, firstFreeTeam, isInAnyMatch, isInAnySpecMatch } from "../../lib/matchs/matchUtils.ts";
import { prisma } from "../../db/client.ts";
import { canJoinRankedMatch } from "../../lib/matchs/eloLib.ts";
import { io } from "../../server.ts";
import { notifyFriendsOfPresence } from "../../index.ts";

export async function joinCodeMatchHandler(req: Request, res: Response) {
	const { code } = req.body ?? {}
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		if (!isString(code))
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>
		const data = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { points: true }
		})

		if (!data)
			return res.status(400).json({ ok: false })

		let match: Matchs | undefined = undefined
		for (const currMatch of currentMatches.values()) {
			if (currMatch.code.toLowerCase() === code.toLowerCase()) {
				match = currMatch
				break
			}
		}

		if (!match)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		if (isInAnyMatch(currentMatches, userId) || isInAnySpecMatch(currentMatches, userId))
			return res.status(409).json({ ok: false, code: "match_err_already_in_match" })

		if (match.players.length >= match.maxPlayers)
			return res.status(400).json({ ok: false, code: "match_err_full" })

		if (match.startedAt !== 0)
			return res.status(400).json({ ok: false, code: "match_err_already_started" })

		if (match.isRanked) {
			const ratingsInMatch = match.players.filter(p => !p.isBot).map(p => p.points)

			if (!canJoinRankedMatch(data.points, ratingsInMatch))
				return res.status(403).json({ ok: false, code: "match_err_rating_gap" })
		}

		const team = firstFreeTeam(match.players, match.teams.length)
		const newPlayer: MatchPlayers = {
			userId,
			username: session.user.username,
			image: session.user.image,
			isReady: false,
			isBot: false,
			team,
			placement: 0,
			points: data.points,
			matchPoints: 0,
			leftAt: 0,
			status: "PLAYED",
			shotsHit: 0,
			shotsTotal: 0
		}

		match.players.push(newPlayer)

		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}

		const activityStatus = req.app.get("activityStatus") as Map<string, PresenceStatus>
		activityStatus.set(userId, "in a match")
		await notifyFriendsOfPresence(userId, "in a match")
		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}