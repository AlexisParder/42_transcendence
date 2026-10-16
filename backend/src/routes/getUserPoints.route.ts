import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "../auth.ts";
import { prisma } from "../db/client.ts";

export async function getUserPointsHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const data = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { points: true }
		})

		res.json({ ok: true, points: data?.points ?? 0 })
	} catch (error) {
		console.error("get-user-points error:", error)
		res.status(500).json({ ok: false })
	}
}