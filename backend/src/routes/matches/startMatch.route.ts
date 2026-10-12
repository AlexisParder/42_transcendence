import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import type { Server } from "socket.io"
import { updatePlayer } from "../../lib/matchs/matchUtils.ts";
import { buildTurnOrder } from "../../lib/matchs/playerOrder.ts";

export async function startMatchHandler(req: Request, res: Response) {
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

		const player = match.players.find(p => p.userId === userId)
		if (!player)
			return res.status(403).json({ ok: false, code: "match_err_no_match" })

		if (match.startedAt !== "")
			return res.status(403).json({ ok: false, code: "match_err_already_started" })

		if (match.hostId !== userId)
			return res.status(400).json({ ok: false, code: "match_err_host" })

		const turnOrder: string[] = buildTurnOrder(match.players, match.type === "TWO_V_TWO")

		match.turns.turnOrder = turnOrder
		match.turns.userTurn = turnOrder[0] ?? null

		if (match.players.some(p => !p.isReady))
			return res.status(400).json({ ok: false, code: "match_err_all_players_not_ready" })

		match.players.map(p => {
			if (p.userId)
				updatePlayer(match, p.userId, { isReady: false })
		})

		match.startedAt = Date.now().toString()
		match.turns.timerStart = match.startedAt

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("start_match")
		}

		res.json({ ok: true })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}