import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { isInAnyMatch } from "../../lib/matchUtils.ts";
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
			return res.status(400).json({ ok: false, code: "no_invited_host" })

		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>
		const match = currentMatches.get(hostId)

		if (!match)
			return res.status(400).json({ ok: false, code: "match_does_not_exist" })

		if (isInAnyMatch(currentMatches, peerId))
			return res.status(409).json({ ok: false, code: "already_in_match" })

		if (match.players.length >= match.maxPlayers)
			return res.status(400).json({ ok: false, code: "match_full" })

		if (match.startedAt !== "")
			return res.status(400).json({ ok: false, code: "match_already_started" })

		if (match.invitedPlayers && match.invitedPlayers.some(p => p === peerId))
			return res.status(400).json({ ok: false, code: "already_invited" })

		match.invitedPlayers.push(peerId)

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", match)
		}

		res.json({ ok: true })
	} catch (err) {
		console.log(err)
		res.status(500).json({ ok: false })
	}
}