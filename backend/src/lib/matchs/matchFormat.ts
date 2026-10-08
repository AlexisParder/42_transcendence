type Type = "ONE_V_ONE" | "TWO_V_TWO" | "THREE_FFA" | "FOUR_FFA"

export function formatMatch(row: any, userId: string) {
	const { matchs: match, ...me } = row

	const others = match.players.filter((p: any) => p.userId !== userId)

	const min = match.endedAt ? Math.round((+new Date(match.endedAt) - +new Date(match.startedAt)) / 60000) : 0

	let otherPlayer: string | null = null
	switch (match.type) {
		case "ONE_V_ONE": {
			const opp = others[0]
			otherPlayer = opp?.isBot ? null : (opp?.user?.username ?? "?")
			break;
		}
		case "TWO_V_TWO": {
			const mate = others.find((p: any) => p.team === me.team)
			otherPlayer = mate?.isBot ? null : (mate?.user?.username ?? "?")
			break;
		}
	}

	const result: 'win' | 'loss' = match.isRanked ? (me.points >= 0 ? 'win' : 'loss') : (me.placement === 1 ? 'win' : 'loss')

	return {
		id: match.id,
		result,
		otherPlayer,
		placement: (me.placement ?? null) as number | null,
		matchType: match.type as Type,
		matchTime: min,
		ranked: match.isRanked,
		points: (match.isRanked ? Math.abs(me.points) : 'unranked') as number | 'unranked',
	}
}