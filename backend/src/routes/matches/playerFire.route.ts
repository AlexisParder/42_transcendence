import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { ClientToServerEvents, Matchs, ServerToClientEvents, Ship, Shot, SocketData, vect2 } from "../../events.ts";
import type { Server } from "socket.io"
import { filterMatchForUser, isExpired, isTeamEliminated, setFinalPlacement } from "../../lib/matchs/matchUtils.ts";
import { nextTurn } from "../../lib/matchs/turnTimer.ts";

const sameCoords = (a: vect2, b: vect2) => a.x === b.x && a.y === b.y
const isValidCell = (c: any): c is vect2 => c && Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= 0 && c.x < 14 && c.y >= 0 && c.y < 14

function isOnShip(ship: Ship, c: vect2): boolean {
	const minX = Math.min(ship.start.x, ship.end.x)
	const maxX = Math.max(ship.start.x, ship.end.x)
	const minY = Math.min(ship.start.y, ship.end.y)
	const maxY = Math.max(ship.start.y, ship.end.y)

	return c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY
}

export async function playerFireHandler(req: Request, res: Response) {
	const { hostId, coords, targetTeamId }: {
		hostId: string,
		coords: vect2,
		targetTeamId: number,
	} = req.body

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		if (!isValidCell(coords) || !Number.isInteger(targetTeamId))
			return res.status(400).json({ ok: false, code: "match_err_invalid_input" })

		const match = currentMatches.get(hostId)
		if (!match)
			return res.status(400).json({ ok: false, code: "match_err_does_not_exist" })

		const player = match.players.find(p => p.userId === userId)
		if (!player)
			return res.status(403).json({ ok: false, code: "match_err_no_match" })

		if (player.team === targetTeamId)
			return res.status(400).json({ ok: false, code: "match_err_own_team" })

		if (match.startedAt === 0)
			return res.status(403).json({ ok: false, code: "match_err_not_started" })

		if (match.turns.userTurn !== userId)
			return res.status(400).json({ ok: false, code: "match_err_not_your_turn" })

		if (isTeamEliminated(match, player.team))
			return res.status(400).json({ ok: false, code: "match_err_you_eliminated" })

		if (isExpired(match.turns.timerStart, match.settings.time_turn * 1000))
			return res.status(400).json({ ok: false, code: "match_err_time_expired" })

		const team = match.teams.find(t => t.id === targetTeamId)
		if (!team)
			return res.status(400).json({ ok: false, code: "match_err_team_does_not_exist" })

		if (isTeamEliminated(match, targetTeamId))
			return res.status(400).json({ ok: false, code: "match_err_team_eliminated" })

		if (team.shots.some(s => sameCoords(s.coords, coords)))
			return res.status(400).json({ ok: false, code: "match_err_cell_already_shot" })

		const ship = team.ships.find(s => isOnShip(s, coords))
		let shot: Shot

		if (!ship) {
			shot = {
				coords,
				status: "miss",
				ship: null,
				authorId: session.user.id,
				authorTeam: match.players.find(p => p.userId === session.user.id)?.team ?? 0
			}

			team.shots.push(shot)
		} else {
			const previousHits = team.shots.filter(s => s.status === "hit" && isOnShip(ship, s.coords))
			const isSunk = previousHits.length + 1 >= ship.size

			shot = {
				coords,
				status: isSunk ? "sunk" : "hit",
				ship: isSunk ? ship : null,
				authorId: session.user.id,
				authorTeam: match.players.find(p => p.userId === session.user.id)?.team ?? 0
			}

			team.shots.push(shot)

			if (isSunk) {
				previousHits.forEach(s => {
					s.status = "sunk"
					s.ship = ship
				})

				if (isTeamEliminated(match, targetTeamId)) {
					const players = match.players.filter(p => p.team === targetTeamId)
					for (const player of players)
						setFinalPlacement(match, player.userId ?? "")
				}
			}
		}

		const io = req.app.get("io") as Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
		for (const player of match.players) {
			if (player.userId)
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}

		nextTurn(match, io, true)

		res.json({ ok: true, match: filterMatchForUser(match, userId) })
	} catch (err) {
		res.status(500).json({ ok: false })
	}
}