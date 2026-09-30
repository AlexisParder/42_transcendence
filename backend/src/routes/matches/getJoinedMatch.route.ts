import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";

export async function getJoinedMatchHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>
		const matches = Array.from(currentMatches.values())

		let joinedMath = null
		for (const match of matches) {
			if (match.players.some(p => p.userId === session.user.id)) {
				joinedMath = match
				break
			}
		}

		res.json({ ok: true, match: joinedMath })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}