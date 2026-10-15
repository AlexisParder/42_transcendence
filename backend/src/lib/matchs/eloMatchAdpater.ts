import type { MatchPlayers, Matchs } from "../../events.ts";
import { computeFFAMatch, computeTeamMatch, type EloResult, type FFAPlayer, type PairMatchIndex, type TeamPlayer } from "./eloLib.ts";
import { updatePlayer } from "./matchUtils.ts";

export function isRankedmatch(match: Pick<Matchs, "isRanked" | "visibility">) {
	return match.isRanked && match.visibility === "public"
}

export function hasLeft(p: MatchPlayers) {
	return p.status === 'LEFT' || p.leftAt !== 0
}

function isPlaced(p: MatchPlayers) {
	return p.placement > 0
}

function wasEliminated(p: MatchPlayers) {
	return !hasLeft(p) && p.placement > 1
}

function isTeamMatch(match: Pick<Matchs, "type">) {
	return match.type === "TWO_V_TWO"
}

function toEloTeam(team: number): 0 | 1 {
	if (team === 1)
		return 0
	if (team === 2)
		return 1
	throw new Error("err_invalid_team")
}

function winningTeamOf(players: MatchPlayers[]) {
	const winner = players.find(p => p.placement === 1 && !hasLeft(p))

	if (!winner)
		throw new Error("err_no_winner_now")
	return winner.team
}

export function computeMatchElo(match: Matchs, rankedGames: Map<string, number>, pairMatchIndex: PairMatchIndex): EloResult[] {
	if (!isRankedmatch(match))
		return []

	if (match.players.some(p => p.isBot || p.userId === null))
		throw new Error("err_bot_in_ranked")

	if (match.players.some(p => !hasLeft(p) && !isPlaced(p)))
		throw new Error("err_all_players_not_placed")

	const base = (p: MatchPlayers) => {
		const games = rankedGames.get(p.userId!)
		if (games === undefined)
			throw new Error("err_cant_find_number_match_player")

		return {
			id: p.userId!,
			rating: p.points,
			rankedGames: games,
			shotsFired: p.shotsTotal,
			left: hasLeft(p),
			eliminated: wasEliminated(p)
		}
	}

	if (isTeamMatch(match)) {
		const players: TeamPlayer[] = match.players.map(p => ({
			...base(p),
			team: toEloTeam(p.team)
		}))

		return computeTeamMatch(players, toEloTeam(winningTeamOf(match.players)), pairMatchIndex)
	}

	const players: FFAPlayer[] = match.players.map(p => ({
		...base(p),
		placement: p.placement,
	}))
	return computeFFAMatch(players, pairMatchIndex)
}

export function applyEloToMatch(match: Matchs, results: EloResult[]) {
	for (const r of results) {
		const player = match.players.find(p => p.userId === r.id)
		if (player)
			updatePlayer(match, player.userId ?? "", { matchPoints: r.delta })
	}
}