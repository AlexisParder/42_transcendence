import type { MatchPlayers, Matchs, matchType } from "../../events.ts";

export function isInAnyMatch(currentMatches: Map<string, Matchs>, userId: string): boolean {
	for (const match of currentMatches.values()) {
		if (match.players.some(p => p.userId === userId && p.status !== "LEFT" && !p.hasQuit))
			return true
	}
	return false
}

export function isInAnySpecMatch(currentMatches: Map<string, Matchs>, userId: string): boolean {
	for (const match of currentMatches.values()) {
		if (match.spectators.some(p => p === userId))
			return true
	}
	return false
}

export function countTeamPlayers(players: MatchPlayers[], team: number): number {
	let count = 0
	for (const p of players) {
		if (p.team === team)
			count++
	}
	return count
}

export function firstFreeTeam(players: MatchPlayers[], teamCount: number): number {
	let bestTeam = 1
	for (let t = 2; t <= teamCount; t++) {
		if (countTeamPlayers(players, t) < countTeamPlayers(players, bestTeam))
			bestTeam = t
	}
	return bestTeam
}

export function updatePlayer(match: Matchs, userId: string, patch: Partial<MatchPlayers>): MatchPlayers | null {
	const player = match.players.find(p => p.userId === userId)
	if (!player)
		return null

	Object.assign(player, patch)
	return player
}

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"
export function generateCode(existing: Map<string, Matchs>): string {
	let code = ""

	while (!code || existing.has(code)) {
		let suffix = ""
		for (let i = 0; i < 6; i++)
			suffix += CHARS[Math.floor(Math.random() * CHARS.length)]
		code = `s-${suffix}`
	}
	return code
}

export function filterMatchForUser(match: Matchs, userId: string): Matchs {
	const team = match.players.find(p => p.userId === userId)?.team
	const isPlayer = team !== undefined
	const isSpectator = match.spectators.includes(userId)

	let invitedPlayers: string[] = []
	if (isPlayer)
		invitedPlayers = match.invitedPlayers

	let logs = match.logs
	if (!isPlayer && !isSpectator)
		logs = []

	return {
		...match,
		invitedPlayers,
		logs,
		teams: match.teams.map(t =>
			t.id === team ? t : { ...t, ships: [], chat: [] }
		)
	}
}

export const MATCH_CONFIG: Record<matchType, { teams: number, maxPlayers: number }> = {
	ONE_V_ONE: { teams: 2, maxPlayers: 2 },
	BOT: { teams: 2, maxPlayers: 2 },
	TWO_V_TWO: { teams: 2, maxPlayers: 4 },
	FFA: { teams: 4, maxPlayers: 4 },
}

export function isMatchType(value: unknown): value is matchType {
	return typeof value === "string" && Object.hasOwn(MATCH_CONFIG, value)
}

export function isExpired(start: number, durationMs: number): boolean {
	return Date.now() - start >= durationMs
}

export function isTeamEliminated(match: Matchs, teamId: number) {
	const teamData = match.teams.find(t => t.id === teamId)
	if (!teamData)
		return true

	const teamPlayers = match.players.filter(p => p.team === teamId)
	if (teamPlayers.length > 0 && teamPlayers.every(p => p.status === "LEFT"))
		return true

	const sunkCount = new Set(
		(teamData?.shots ?? [])
			.filter(s => s.ship !== null)
			.map(s => s.ship!.name)
	).size

	return teamData.ships.length > 0 && sunkCount >= teamData.ships.length
}

export function setFinalPlacement(match: Matchs, playerId: string) {
	const player = match.players.find(p => p.userId === playerId)
	if (!player)
		return

	let otherAliveTeams = 0
	for (const team of match.teams) {
		if (team.id !== player.team && !isTeamEliminated(match, team.id))
			otherAliveTeams++
	}

	player.placement = otherAliveTeams + 1
}

export function isMatchWon(status: string, placement: number | null) {
	return status !== "LEFT" && placement === 1
}

export function findActiveMatchOf(currentMatches: Map<string, Matchs>, userId: string) {
	for (const match of currentMatches.values()) {
		if (match.endedAt !== 0)
			continue

		const player = match.players.find(p => p.userId === userId)
		if (player && player.status === "PLAYED" && !player.hasQuit)
			return match
	}
	return undefined
}