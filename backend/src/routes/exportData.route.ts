import { fromNodeHeaders } from "better-auth/node"
import type { Request, Response } from "express"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"

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
				orderBy: { matchs: { startedAt: "asc" } },
				select: {
					team: true, placement: true, points: true, status: true, leftAt: true, shotsHit: true, shotsTotal: true,
					matchs: {
						select: {
							type: true, isRanked: true, startedAt: true, endedAt: true,
							players: { where: { userId: { not: userId } }, select: { isBot: true, team: true, user: { select: { username: true } } } }
						}
					}
				}
			}),
		])

		if (!user)
			return res.status(404).json({ ok: false })

		const peerIds = [...new Set(messages.map(m => m.userId === userId ? m.targetId : m.userId))]
		const peers = await prisma.user.findMany({
			where: { id: { in: peerIds } },
			select: { id: true, username: true }
		})
		const peerNames = new Map(peers.map(p => [p.id, p.username]))

		const data = {
			exportedAt: new Date().toISOString(),
			profile: user,
			linkedAccounts: accounts,
			sessions,
			friends: friends.map(f => ({
				username: f.userId === userId ? f.target.username : f.user.username,
				isAccepted: f.isAccepted,
				direction: f.userId === userId ? "sent" : "received",
			})),
			blocked: blocked.map(b => b.target.username),
			messages: messages.map(m => {
				const isSent = m.userId === userId
				return {
					direction: isSent ? "sent" : "received",
					with: peerNames.get(isSent ? m.targetId : m.userId) ?? null,
					message: m.message,
					sendAt: m.sendAt,
					isRead: m.isRead,
				}
			}),
			matches: matches.map(m => ({
				type: m.matchs.type,
				isRanked: m.matchs.isRanked,
				startedAt: m.matchs.startedAt,
				endedAt: m.matchs.endedAt,
				team: m.team,
				placement: m.placement,
				points: m.points,
				status: m.status,
				leftAt: m.leftAt,
				shotsHit: m.shotsHit,
				shotsTotal: m.shotsTotal,
				opponents: m.matchs.players.map(p => ({
					username: p.isBot ? "bot" : p.user?.username ?? null,
					team: p.team,
				})),
			})),
		}

		const date = data.exportedAt.slice(0, 10)
		res.attachment(`sonar-export-${user.username ?? user.id}-${date}.json`)
		res.json(data)
	} catch (error) {
		console.error("export-data error:", error)
		res.status(500).json({ ok: false })
	}
}
