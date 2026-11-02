import { fromNodeHeaders } from "better-auth/node"
import type { Request, Response } from "express"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"
import { t } from "../lib/translate.ts"
import { notifySecurity } from "../lib/notify.ts"
import { isMatchWon } from "../lib/matchs/matchUtils.ts"

export async function exportDataHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id

		const [user, accounts, sessions, friends, blocked, messages, matches] = await Promise.all([
			prisma.user.findUnique({
				where: { id: userId },
				select: { id: true, email: true, emailVerified: true, username: true, displayUsername: true, name: true, language: true, points: true, twoFactorEnabled: true, image: true, createdAt: true, updatedAt: true }
			}),
			prisma.account.findMany({
				where: { userId },
				select: { providerId: true, createdAt: true }
			}),
			prisma.session.findMany({
				where: { userId },
				select: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true }
			}),
			prisma.friends.findMany({
				where: { OR: [{ userId }, { targetId: userId }] },
				select: { userId: true, isAccepted: true, user: { select: { username: true } }, target: { select: { username: true } } }
			}),
			prisma.userBlocked.findMany({
				where: { userId },
				select: { target: { select: { username: true } } }
			}),
			prisma.conversations.findMany({
				where: { OR: [{ userId }, { targetId: userId }] },
				orderBy: { sendAt: "asc" },
				select: { userId: true, targetId: true, message: true, sendAt: true, isRead: true }
			}),
			prisma.matchPlayers.findMany({
				where: { userId },
				orderBy: { matchs: { startedAt: "desc" } },
				select: {
					id: true, team: true, placement: true, points: true, status: true, leftAt: true, shotsHit: true, shotsTotal: true,
					matchs: {
						select: {
							id: true, type: true, isRanked: true, startedAt: true, endedAt: true,
							players: { select: { id: true, isBot: true, team: true, placement: true, user: { select: { username: true } } } }
						}
					}
				}
			}),
		])

		if (!user)
			return res.status(404).json({ ok: false })

		const exportedAt = new Date().toISOString()
		const data: Record<string, unknown> = { exportedAt }

		const { points, ...profile } = user
		data.profile = profile
		data.linkedAccounts = accounts
		data.sessions = sessions

		data.friends = friends.map(f => ({
			username: f.userId === userId ? f.target.username : f.user.username,
			isAccepted: f.isAccepted,
			direction: f.userId === userId ? "sent" : "received",
		}))
		data.blocked = blocked.map(b => b.target.username)

		const conversations: Record<string, any[]> = {}
		for (const m of messages) {
			const isSent = m.userId === userId
			const peerId = isSent ? m.targetId : m.userId

			if (!conversations[peerId])
				conversations[peerId] = []

			conversations[peerId].push({
				direction: isSent ? "sent" : "received",
				message: m.message,
				sendAt: m.sendAt,
				isRead: m.isRead,
			})
		}

		const peers = await prisma.user.findMany({
			where: { id: { in: Object.keys(conversations) } },
			select: { id: true, username: true }
		})

		const conversationList = []
		for (const peerId in conversations) {
			const peer = peers.find(p => p.id === peerId)
			conversationList.push({
				with: peer ? peer.username : null,
				messages: conversations[peerId],
			})
		}
		data.conversations = conversationList

		const rank = await prisma.ranks.findFirst({
			where: { min: { lte: points } },
			orderBy: { min: "desc" }
		})
		let rankLabel = null
		if (rank) {
			if (user.language === "fr")
				rankLabel = rank.fr_label
			else if (user.language === "es")
				rankLabel = rank.es_label
			else
				rankLabel = rank.en_label
		}

		let wins = 0
		let left = 0
		let shotsHit = 0
		let shotsTotal = 0
		for (const m of matches) {
			shotsHit += m.shotsHit
			shotsTotal += m.shotsTotal

			if (m.status === "LEFT")
				left++
			else if (isMatchWon(m.status, m.placement))
				wins++
		}

		let accuracy = 0
		if (shotsTotal > 0)
			accuracy = Math.round((shotsHit / shotsTotal) * 100) / 100

		const stats = {
			matchesPlayed: matches.length,
			wins,
			losses: matches.length - wins - left,
			left,
			shotsHit,
			shotsTotal,
			accuracy,
		}

		const matchList = []

		for (const m of matches) {
			const players = []

			for (const p of m.matchs.players) {
				if (p.id === m.id)
					continue

				players.push({
					username: p.user ? p.user.username : null,
					isBot: p.isBot,
					team: p.team,
					placement: p.placement,
				})
			}

			matchList.push({
				type: t(user.language, `txt_${m.matchs.type}`),
				isRanked: m.matchs.isRanked,
				startedAt: m.matchs.startedAt,
				endedAt: m.matchs.endedAt,
				you: {
					team: m.team,
					placement: m.placement,
					points: m.points,
					status: m.status,
					leftAt: m.leftAt,
					shotsHit: m.shotsHit,
					shotsTotal: m.shotsTotal,
				},
				players,
			})
		}

		data.game = { points, rank: rankLabel, stats, matches: matchList }

		const achievements = await prisma.userAchievement.findMany({
			where: { userId },
			orderBy: { unlockedAt: "asc" },
			select: { achievementId: true, unlockedAt: true }
		})
		data.achievements = achievements

		notifySecurity(userId, "data_exported")

		res.attachment(`sonar-export-${user.username ?? user.id}-${exportedAt.slice(0, 10)}.json`)
		res.json(data)
	} catch (error) {
		console.error("export-data error:", error)
		res.status(500).json({ ok: false })
	}
}
