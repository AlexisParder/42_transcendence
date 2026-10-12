import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { filterMatchForUser, isInAnyMatch } from "../../lib/matchs/matchUtils.ts";
import type { Server } from "socket.io"

export async function inviteMatchHandler(req: Request, res: Response) {
	const { hostId, peerId } = req.body
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		if (hostId === peerId)
			return res.status(400).json({ ok: false, code: "match_err_invite_host" })

		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>
		const match = currentMatches.get(hostId)

		if (!match)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		if (isInAnyMatch(currentMatches, peerId))
			return res.status(409).json({ ok: false, code: "match_err_already_in_match" })

		if (match.players.length >= match.maxPlayers)
			return res.status(400).json({ ok: false, code: "match_err_full" })

		if (match.startedAt !== 0)
			return res.status(400).json({ ok: false, code: "match_err_already_started" })

		if (match.invitedPlayers && match.invitedPlayers.some(p => p === peerId))
			return res.status(400).json({ ok: false, code: "match_err_already_invited" })

		match.invitedPlayers.push(peerId)

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}

		res.json({ ok: true })
	} catch (err) {
		console.log(err)
		res.status(500).json({ ok: false })
	}
}