import type { MatchPlayers, Matchs } from "../events.ts";

export function isInAnyMatch(currentMatches: Map<string, Matchs>, userId: string): boolean {
	for (const match of currentMatches.values()) {
		if (match.players.some(p => p.userId === userId))
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