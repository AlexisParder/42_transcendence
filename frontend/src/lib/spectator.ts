import type { Matchs } from "../types/events";

export function isSpectator(match: Matchs, userId: string | null | undefined) {
	return match.spectators.find(p => p === userId) ? true : false
}