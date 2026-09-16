type Mode = "ONE_V_ONE" | "TWO_V_TWO" | "THREE_FFA" | "FOUR_FFA"

function ordinal(n: number): string {
	const s = ['th', 'st', 'nd', 'rd']
	const v = n % 100
	return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function formatMatch(row: any, userId: string) {
	const { matchs: match, ...me } = row

	const others = match.players.filter((p: any) => p.userId !== userId)

	const min = match.endedAt ? Math.round((+new Date(match.endedAt) - +new Date(match.startedAt)) / 60000) : 0

	let desc = ""
	switch (match.mode) {
		case "ONE_V_ONE": {
			const opp = others[0]
			desc = opp?.isBot ? 'vs Bot' : `vs ${opp?.user?.username ?? "?"}`
			break;
		}
		case "TWO_V_TWO": {
			const mate = others.find((p: any) => p.team === me.team)
			desc = mate?.isBot ? 'Duo with Bot' : `Duo with ${mate?.user?.username ?? "?"}`
			break;
		}
		default: {
			desc = me.placement ? `FFA - ${ordinal(me.placement)} place` : 'FFA'
			break;
		}
	}

	const result: 'win' | 'loss' = match.isRanked ? (me.points >= 0 ? 'win' : 'loss') : (me.placement === 1 ? 'win' : 'loss')

	return {
		id: match.id,
		result,
		desc,
		matchType: match.mode as Mode,
		matchTime: `${min} min`,
		ranked: match.isRanked,
		points: (match.isRanked ? Math.abs(me.points) : 'unranked') as number | 'unranked',
	}
}