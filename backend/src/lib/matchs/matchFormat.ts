import { isMatchWon } from "./matchUtils.ts"

type Type = "ONE_V_ONE" | "TWO_V_TWO" | "FFA"

export function formatMatch(row: any, userId: string) {
	const { matchs: match, ...me } = row

	const others = match.players.filter((p: any) => p.userId !== userId)

	const min = match.endedAt ? Math.round((+new Date(match.endedAt) - +new Date(match.startedAt)) / 60000) : 0

	let other: any = null
	switch (match.type) {
		case "ONE_V_ONE":
			other = others[0]
			break;
		case "TWO_V_TWO":
			other = others.find((p: any) => p.team === me.team)
			break;
	}
	const otherPlayer: string | null = other && !other.isBot ? (other.user?.username ?? null) : null
	const otherDeleted = !!other && !other.isBot && !other.user

	const result: 'win' | 'loss' = isMatchWon(me.status, me.placement) ? 'win' : 'loss'

	return {
		id: match.id,
		result,
		otherPlayer,
		otherDeleted,
		placement: (me.placement ?? null) as number | null,
		matchType: match.type as Type,
		matchTime: min,
		ranked: match.isRanked,
		points: (match.isRanked ? me.points : 'unranked') as number | 'unranked',
	}
}