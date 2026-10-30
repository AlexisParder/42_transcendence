import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";
import type { Rank, UserInfo } from "../events.ts";

const FALLBACK_RANK: Rank = {
	id: "custom",
	en_label: "cabin boy",
	fr_label: "mousse",
	es_label: "grumete",
	min: Number.MIN_SAFE_INTEGER
}

export async function getUserInfoHandler(req: Request, res: Response) {
	const { targetId } = req.body

	if (targetId !== undefined && typeof targetId !== "string")
		return res.status(400).json({ ok: false })

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		let username: string | null | undefined
		let image: string | null | undefined
		let createdAt: Date
		let points: number
		let isMine: boolean
		let ldbPos: number

		if (targetId) {
			const target = await prisma.user.findUnique({
				where: { id: targetId },
				select: { points: true, username: true, image: true, createdAt: true }
			})

			if (target) {
				username = target.username
				image = target.image
				createdAt = target.createdAt
				points = target.points ?? 0
				isMine = targetId === session.user.id
			} else {
				username = session.user.username
				image = session.user.image
				createdAt = session.user.createdAt
				points = session.user.points ?? 0
				isMine = true
			}
		} else {
			username = session.user.username
			image = session.user.image
			createdAt = session.user.createdAt
			points = session.user.points ?? 0
			isMine = true
		}

		const rank = (await prisma.ranks.findFirst({
			where: { min: { lte: points } },
			orderBy: { min: "desc" }
		})) ?? FALLBACK_RANK

		ldbPos = (await prisma.user.count({
			where: { points: { gt: points } }
		})) + 1

		const userInfo: UserInfo = {
			points,
			username,
			image,
			createdAt: createdAt.toISOString(),
			leaderboardPos: ldbPos,
			isMine
		}

		res.json({ ok: true, rank, userInfo })
	} catch (error) {
		console.error("get-user-info error:", error)
		res.status(500).json({ ok: false })
	}
}