import type { MatchPlayers, Matchs, matchType } from "../../events.ts";

export function isInAnyMatch(currentMatches: Map<string, Matchs>, userId: string): boolean {
	for (const match of currentMatches.values()) {
		if (match.players.some(p => p.userId === userId && p.status !== "LEFT"))
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

export function firstFreeTeam(players: MatchPlayers[], teamSize: number): number {
	const counts = new Map<number, number>()
	for (const p of players)
		counts.set(p.team, (counts.get(p.team) ?? 0) + 1)

	let t = 1
	while ((counts.get(t) ?? 0) >= teamSize)
		t++
	return t
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

	return {
		...match,
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
	const playersPlaced = match.players.filter(p => p.placement > 0).length

	updatePlayer(match, playerId, {
		placement: match.players.length - playersPlaced
	})
}

export function findActiveMatchOf(currentMatches: Map<string, Matchs>, userId: string) {
	for (const match of currentMatches.values()) {
		if (match.endedAt !== 0)
			continue

		const player = match.players.find(p => p.userId === userId)
		if (player && player.status === "PLAYED")
			return match
	}
	return undefined
}