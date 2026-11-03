import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs, PresenceStatus } from "../../events.ts";
import { filterMatchForUser, findHostedMatch, generateCode, isInAnyMatch, isInAnySpecMatch, isMatchType, MATCH_CONFIG } from "../../lib/matchs/matchUtils.ts";
import { prisma } from "../../db/client.ts";
import { notifyFriendsOfPresence } from "../../index.ts";
import { createBotPlayer } from "../../lib/matchs/bot/botPlayer.ts";
import { closeLobby } from "../../lib/matchs/turnTimer.ts";
import { io } from "../../server.ts";
import { newMatchId } from "../../mapMatches.ts";

const LOBBY_MAX_TIME = 30 * 60 * 1000

export async function createMatchHandler(req: Request, res: Response) {
	const { selectedMatchType, visibility, timeTurn, replace, spectators } = req.body ?? {}
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<number, Matchs>
		const data = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { points: true }
		})

		if (!data)
			return res.status(400).json({ ok: false })

		if (isInAnyMatch(currentMatches, userId) || isInAnySpecMatch(currentMatches, userId))
			return res.status(409).json({ ok: false, code: "match_err_already_in_match" })

		if (findHostedMatch(currentMatches, userId))
			return res.status(409).json({ ok: false, code: "match_err_your_host_match_not_end" })

		if (!isMatchType(selectedMatchType))
			return res.status(400).json({ ok: false })

		if (visibility !== "public" && visibility !== "private")
			return res.status(400).json({ ok: false })

		if (!Number.isInteger(timeTurn) || timeTurn < 10 || timeTurn > 60)
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		if (typeof replace !== "boolean" || typeof spectators !== "boolean")
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		if (replace && selectedMatchType !== "ONE_V_ONE" && selectedMatchType !== "FFA")
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		const code = generateCode(currentMatches)

		const matchId = newMatchId()

		const newMatch: Matchs = {
			type: selectedMatchType,
			settings: {
				time_turn: timeTurn,
				replace,
				spectators
			},
			code,
			step: "deploy",
			visibility,
			isRanked: selectedMatchType !== "BOT" && !replace && visibility === "public",
			startedAt: 0,
			endedAt: 0,
			hostId: matchId,
			maxPlayers: MATCH_CONFIG[selectedMatchType].maxPlayers,
			invitedPlayers: [],
			turns: {
				timerStart: 0,
				userTurn: null,
				isBotTurn: false,
				turnOrder: []
			},
			teams: Array.from({ length: MATCH_CONFIG[selectedMatchType].teams }, (_, i) => ({
				id: i + 1,
				ships: [],
				shots: [],
				chat: []
			})),
			players: [
				{
					userId,
					username: session.user.username,
					image: session.user.image,
					isReady: true,
					isBot: false,
					isHost: true,
					team: 1,
					placement: 0,
					points: data.points,
					matchPoints: 0,
					leftAt: 0,
					status: "PLAYED",
					shotsHit: 0,
					shotsTotal: 0
				}
			],
			logs: [],
			spectators: [],
		}

		if (selectedMatchType === "BOT")
			newMatch.players.push(createBotPlayer(matchId, 2))

		currentMatches.set(matchId, newMatch)

		setTimeout(() => {
			if (currentMatches.get(matchId) === newMatch && newMatch.startedAt === 0)
				closeLobby(newMatch, io)
		}, LOBBY_MAX_TIME)
		const activityStatus = req.app.get("activityStatus") as Map<string, PresenceStatus>
		activityStatus.set(userId, "in a match")
		await notifyFriendsOfPresence(userId, "in a match")
		res.json({ ok: true, match: filterMatchForUser(newMatch, userId) })
	} catch (err) {
		console.log(err)
		res.status(500).json({ ok: false })
	}
}