import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, MatchPlayers, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { firstFreeTeam, isInAnyMatch } from "../../lib/matchUtils.ts";
import type { Server } from "socket.io"

export async function joinCodeMatchHandler(req: Request, res: Response) {
	const { code } = req.body
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		let match: Matchs | undefined = undefined
		for (const currMatch of currentMatches.values()) {
			if (currMatch.code.toLowerCase() === code.toLowerCase()) {
				match = currMatch
				break
			}
		}

		if (!match || match === undefined)
			return res.status(400).json({ ok: false, code: "match_does_not_exist" })

		if (isInAnyMatch(currentMatches, userId))
			return res.status(409).json({ ok: false, code: "already_in_match" })

		if (match.players.length >= match.maxPlayers)
			return res.status(400).json({ ok: false, code: "match_full" })

		if (match.startedAt !== "")
			return res.status(400).json({ ok: false, code: "match_already_started" })

		const team = firstFreeTeam(match.players, match.mode === "TWO_V_TWO" ? 2 : 1)
		const newPlayer: MatchPlayers = {
			userId,
			username: session.user.username,
			image: session.user.image,
			isReady: false,
			isBot: false,
			team,
			placement: team,
			points: session.user.points ?? 0,
			leftAt: null,
			status: "PLAYED",
			shotsHit: 0,
			shotsTotal: 0
		}

		match.players.push(newPlayer)

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId && player.userId !== userId)
				io.to(player.userId).emit("refresh_joined_match", match)
		}

		res.json({ ok: true, match })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}