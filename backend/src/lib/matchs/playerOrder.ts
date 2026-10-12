import { randomInt } from "node:crypto"
import type { MatchPlayers } from "../../events.ts"

function shuffleIds(ids: readonly string[]): string[] {
	const res: string[] = [...ids]

	for (let i = res.length - 1; i > 0; i--) {
		const j: number = randomInt(i + 1);
		[res[i], res[j]] = [res[j], res[i]]
	}

	return res
}

function groupIdsByTeam(players: readonly MatchPlayers[]): Map<number, string[]> {
	const teams: Map<number, string[]> = new Map<number, string[]>()

	for (const player of players) {
		if (player.status === "LEFT" || player.userId === null)
			continue

		const ids: string[] = teams.get(player.team) ?? []
		ids.push(player.userId)
		teams.set(player.team, ids)
	}

	return teams
}

function getActiveIds(players: readonly MatchPlayers[]): string[] {
	const ids: string[] = []

	for (const player of players) {
		if (player.status === "LEFT" || player.userId === null)
			continue

		ids.push(player.userId)
	}

	return ids
}

function buildDuoOrder(players: readonly MatchPlayers[]): string[] {
	const teams: string[][] = [...groupIdsByTeam(players).values()].map(
		(ids: string[]): string[] => shuffleIds(ids)
	)

	const start: number = teams.length > 0 ? randomInt(teams.length) : 0
	const orderedTeams: string[][] = [...teams.slice(start), ...teams.slice(0, start)]
	const res: string[] = []
	const maxLength: number = Math.max(0, ...orderedTeams.map((ids: string[]): number => ids.length))

	for (let i = 0; i < maxLength; i++) {
		for (const ids of orderedTeams) {
			if (i < ids.length)
				res.push(ids[i])
		}
	}

	return res
}

export function buildTurnOrder(players: readonly MatchPlayers[], isDuo: boolean): string[] {
	return isDuo ? buildDuoOrder(players) : shuffleIds(getActiveIds(players))
}