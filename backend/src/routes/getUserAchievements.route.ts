import { fromNodeHeaders } from "better-auth/node"
import type { Request, Response } from "express"
import { isOptionalString } from "../lib/validate.ts"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"
import { achievements } from "../lib/achievements.ts"

export async function getUserAchievementsHandler(req: Request, res: Response) {
	const { targetId } = req.body ?? {}

	if (!isOptionalString(targetId))
		return res.status(400).json({ ok: false })

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = targetId || session.user.id

		const unlocked = await prisma.userAchievement.findMany({
			where: { userId },
			select: { achievementId: true, unlockedAt: true }
		})

		const list = []
		for (const achievement of achievements) {
			const found = unlocked.find(u => u.achievementId === achievement.id)
			list.push({
				id: achievement.id,
				difficulty: achievement.difficulty,
				unlocked: found !== undefined,
				unlockedAt: found ? found.unlockedAt : null,
			})
		}

		res.json({ ok: true, achievements: list })
	} catch (error) {
		console.error("get-user-achievements error:", error)
		res.status(500).json({ ok: false })
	}
}
