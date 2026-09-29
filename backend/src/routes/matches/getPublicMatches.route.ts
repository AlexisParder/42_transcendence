import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";

export async function getPublicMatchesHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>
		const matches = Array.from(currentMatches.values())

		const publicMatches = matches.filter(m => m.visibility === "public")

		res.json({ ok: true, matches: publicMatches })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}