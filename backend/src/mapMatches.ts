import type { Matchs } from "./events.ts";

export const currentMatches = new Map<number, Matchs>()

let nextMatchId = 0

export function newMatchId(): number {
	return nextMatchId++
}
