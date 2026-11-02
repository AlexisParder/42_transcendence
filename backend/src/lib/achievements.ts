import { prisma } from "../db/client.ts"
import { notify } from "./notify.ts"

type PlayerStats = {
	matchesPlayed: number
	wins: number
	wins2v2: number
	winsFFA: number
	points: number
	lastMatchWon: boolean
	lastMatchAccuracy: number
}

type Achievement = {
	id: string
	difficulty: "easy" | "medium" | "hard"
	check: (s: PlayerStats) => boolean
}

export const achievements: Achievement[] = [
	{ id: "first_match", difficulty: "easy", check: s => s.matchesPlayed >= 1 },
	{ id: "first_win", difficulty: "easy", check: s => s.wins >= 1 },
	{ id: "veteran", difficulty: "medium", check: s => s.matchesPlayed >= 50 },
	{ id: "duo", difficulty: "medium", check: s => s.wins2v2 >= 2 },
	{ id: "survivor", difficulty: "medium", check: s => s.winsFFA >= 1 },
	{ id: "sniper", difficulty: "hard", check: s => s.lastMatchWon && s.lastMatchAccuracy >= 0.8 },
	{ id: "admiral", difficulty: "hard", check: s => s.points >= 1000 },
]

async function getPlayerStats(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { points: true }
	})
	if (!user)
		return null

	const matches = await prisma.matchPlayers.findMany({
		where: { userId },
		orderBy: { matchs: { endedAt: "desc" } },
		select: { placement: true, points: true, status: true, shotsHit: true, shotsTotal: true, matchs: { select: { type: true, isRanked: true } } }
	})

	const stats: PlayerStats = {
		matchesPlayed: matches.length,
		wins: 0,
		wins2v2: 0,
		winsFFA: 0,
		points: user.points,
		lastMatchWon: false,
		lastMatchAccuracy: 0,
	}

	for (let i = 0; i < matches.length; i++) {
		const m = matches[i]

		let won = false
		if (m.status === "LEFT")
			won = false
		else if (m.matchs.isRanked)
			won = m.points >= 0
		else
			won = m.placement === 1

		if (won) {
			stats.wins++
			if (m.matchs.type === "TWO_V_TWO")
				stats.wins2v2++
			if (m.matchs.type === "FFA")
				stats.winsFFA++
		}

		if (i === 0) {
			stats.lastMatchWon = won
			if (m.shotsTotal > 0)
				stats.lastMatchAccuracy = m.shotsHit / m.shotsTotal
		}
	}

	return stats
}

export async function checkAchievements(userId: string) {
	try {
		const stats = await getPlayerStats(userId)
		if (!stats)
			return

		const unlocked = await prisma.userAchievement.findMany({
			where: { userId },
			select: { achievementId: true }
		})

		for (const achievement of achievements) {
			const alreadyUnlocked = unlocked.find(u => u.achievementId === achievement.id)
			if (alreadyUnlocked || !achievement.check(stats))
				continue

			await prisma.userAchievement.create({
				data: { userId, achievementId: achievement.id }
			})

			void notify({
				userId,
				title: "notifications_achievement",
				description: `ach_${achievement.id}`,
				save: true,
				category: "achievements",
			})
		}
	} catch (error) {
		console.error("check achievements error:", error)
	}
}
