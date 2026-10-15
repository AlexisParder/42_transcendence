export const ELO = {
	START_RATING: 0,
	K: 32,
	K_PROVISIONAL: 48,
	PROVISIONAL_GAMES: 10,
	MIN_SHOTS: 10,
	NO_ELIMINATION_MULT: 0.5,
	PROVISIONAL_OPPONENT_MULT: 0.25,
	PAIR_MULTS: [1, 0.5, 0.25],
	SHORTHANDED_WIN_MULT: 0.5,
	LONE_TEAMMATE_LOSS_MULT: 0.25,
	JOIN_MAX_GAP: 400,
} as const

export interface PlayerState {
	id: string,
	rating: number,
	rankedGames: number,
	shotsFired: number,
	left: boolean,
	eliminated: boolean
}

export interface FFAPlayer extends PlayerState {
	placement: number
}

export interface TeamPlayer extends PlayerState {
	team: 0 | 1
}

export type PairMatchIndex = (playerA: string, playerB: string) => number

export interface EloResult {
	id: string,
	ratingBefore: number,
	delta: number,
	ratingAfer: number
}

export function expectedScore(ratingA: number, ratingB: number) {
	return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function eloDelta(k: number, score: 0 | 1, expected: number) {
	return k * (score - expected)
}

export function teamRating(ratings: number[]) {
	return ratings.reduce((sum, r) => sum + r, 0) / ratings.length
}

export function isProvisional(player: Pick<PlayerState, "rankedGames">) {
	return player.rankedGames < ELO.PROVISIONAL_GAMES
}

export function kFactor(player: Pick<PlayerState, "rankedGames">) {
	return isProvisional(player) ? ELO.K_PROVISIONAL : ELO.K
}

export function pairMultiplier(mathIndex: number) {
	const i = Math.max(1, mathIndex) - 1

	return ELO.PAIR_MULTS[Math.min(i, ELO.PAIR_MULTS.length - 1)]
}

export function provisionalMultiplier(opponent: Pick<PlayerState, "rankedGames">) {
	return isProvisional(opponent) ? ELO.PROVISIONAL_OPPONENT_MULT : 1
}

export function thresholdMultiplier(opponent: Pick<PlayerState, "left" | "shotsFired">) {
	if (!opponent.left)
		return 1

	return opponent.shotsFired >= ELO.MIN_SHOTS ? 1 : 0
}

export function eliminationMultipier(opponents: Pick<PlayerState, "eliminated">[]) {
	return opponents.some((o) => o.eliminated) ? 1 : ELO.NO_ELIMINATION_MULT
}

export function canJoinRankedMatch(playerRating: number, ratingsInMatch: number[]) {
	if (ratingsInMatch.length === 0)
		return true

	return Math.abs(playerRating - teamRating(ratingsInMatch)) <= ELO.JOIN_MAX_GAP
}

function duelScore(i: FFAPlayer, j: FFAPlayer): 0 | 1 {
	if (i.left)
		return 0

	if (j.left)
		return 1

	return i.placement < j.placement ? 1 : 0
}

export function computeFFAMatch(players: FFAPlayer[], pairMatchIndex: PairMatchIndex): EloResult[] {
	const n = players.length
	if (n < 2)
		throw new Error("err_need_2_players_or_more")

	return players.map(p => {
		const opponents = players.filter(o => o.id !== p.id)
		const kPerDuel = kFactor(p) / (n - 1)
		const mElim = eliminationMultipier(opponents)

		let total = 0
		for (const o of opponents) {
			let term = kPerDuel * (duelScore(p, o) - expectedScore(p.rating, o.rating))

			if (term > 0 && !p.left)
				term *= thresholdMultiplier(o) * mElim * pairMultiplier(pairMatchIndex(p.id, o.id)) * provisionalMultiplier(o)
			total += term
		}

		const delta = Math.round(total)
		return {
			id: p.id,
			ratingBefore: p.rating,
			delta,
			ratingAfer: p.rating + delta
		}
	})
}

export function computeTeamMatch(players: TeamPlayer[], winningTeam: 0 | 1, pairMatchIndex: PairMatchIndex): EloResult[] {
	const teams = [0, 1].map(t => players.filter(p => p.team === t))
	if (teams[0].length === 0 || teams[1].length === 0)
		throw new Error("err_need_2_teams")

	const ratings = teams.map(t => teamRating(t.map(p => p.rating)))

	return players.map(p => {
		const own = teams[p.team]
		const opp = teams[1 - p.team]
		const expected = expectedScore(ratings[p.team], ratings[1 - p.team])
		const won = p.team === winningTeam && !p.left

		let delta = eloDelta(kFactor(p), won ? 1 : 0, expected)
		if (delta > 0) {
			const allOpponentsLeft = opp.every(o => o.left)
			const someOpponentsLeft = opp.some(o => o.left)

			const mSeuil = allOpponentsLeft ? Math.min(...opp.map(thresholdMultiplier)): 1
			const mElim = eliminationMultipier(opp)
			const mPaire = Math.min(...opp.map(o => pairMultiplier(pairMatchIndex(p.id, o.id))))
			const mProv = Math.min(...opp.map(provisionalMultiplier))
			const mShort = someOpponentsLeft && !allOpponentsLeft ? ELO.SHORTHANDED_WIN_MULT : 1

			delta *= mSeuil * mElim * mPaire * mProv * mShort
		} else if (!p.left && own.some(o => o.id !== p.id && o.left)) {
			delta *= ELO.LONE_TEAMMATE_LOSS_MULT
		}

		const rounded = Math.round(delta)
		return {
			id: p.id,
			ratingBefore: p.rating,
			delta: rounded,
			ratingAfer: p.rating + rounded
		}
	})
}