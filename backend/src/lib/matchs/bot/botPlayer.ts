import type { MatchPlayers } from "../../../events.ts"

const BOT_USERNAME = "Bot"

export function createBotPlayer(hostId: string, team: number): MatchPlayers {
	return {
		userId: `bot-${hostId}`,
		username: BOT_USERNAME,
		image: null,
		isReady: true,
		isBot: true,
		team,
		placement: 0,
		points: 0,
		matchPoints: 0,
		leftAt: 0,
		status: "PLAYED",
		shotsHit: 0,
		shotsTotal: 0
	}
}
