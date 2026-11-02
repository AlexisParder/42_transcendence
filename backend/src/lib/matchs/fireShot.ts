import type { Server } from "socket.io"
import type { ClientToServerEvents, Log, MatchPlayers, Matchs, ServerToClientEvents, Ship, Shot, SocketData, Teams, vect2 } from "../../events.ts"
import { isTeamEliminated, setFinalPlacement } from "./matchUtils.ts"
import { nextTurn } from "./turnTimer.ts"
import { addLog } from "./logMatch.ts"

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

function isOnShip(ship: Ship, c: vect2): boolean {
	const minX = Math.min(ship.start.x, ship.end.x)
	const maxX = Math.max(ship.start.x, ship.end.x)
	const minY = Math.min(ship.start.y, ship.end.y)
	const maxY = Math.max(ship.start.y, ship.end.y)

	return c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY
}

export function fireShot(match: Matchs, shooter: MatchPlayers, team: Teams, coords: vect2, io: IO) {
	const ship = team.ships.find(s => isOnShip(s, coords))
	let shot: Shot

	if (!ship) {
		shot = {
			coords,
			status: "miss",
			ship: null,
			authorId: shooter.userId,
			authorTeam: shooter.team
		}

		team.shots.push(shot)
	} else {
		const previousHits = team.shots.filter(s => s.status === "hit" && isOnShip(ship, s.coords))
		const isSunk = previousHits.length + 1 >= ship.size

		shot = {
			coords,
			status: isSunk ? "sunk" : "hit",
			ship: isSunk ? ship : null,
			authorId: shooter.userId,
			authorTeam: shooter.team
		}

		team.shots.push(shot)

		if (isSunk) {
			previousHits.forEach(s => {
				s.status = "sunk"
				s.ship = ship
			})

			if (isTeamEliminated(match, team.id)) {
				const players = match.players.filter(p => p.team === team.id && p.placement === 0)
				for (const player of players)
					setFinalPlacement(match, player.userId ?? "")
			}
		}
	}

	const targetData = match.players.find(p => p.team === team.id)

	const log: Log = {
		timestamp: Date.now(),
		authorId: shooter.userId,
		authorUsername: shooter.username,
		targetId: targetData?.userId,
		targetUsername: targetData?.username,
		logType: "fire",
		shot: { ...shot }
	}

	addLog(match, log, io, false)

	nextTurn(match, io, true)
}
