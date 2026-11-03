import type { Matchs } from "../../types/events"

export function getVisiblesMatches(matches: Matchs[]) {
	return matches.map(m => {
		const started = m.startedAt !== 0
		const canJoin = !started && m.players.length < m.maxPlayers
		const canSpec = started && m.settings.spectators
		const host = m.players.find(p => p.isHost)
		return { m, host, canJoin, canSpec }
	}).filter(({ canJoin, canSpec }) => canJoin || canSpec)
		.sort((a, b) => Number(b.canJoin) - Number(a.canJoin))
}