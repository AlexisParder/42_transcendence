import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express"
import { auth } from "../../auth.ts";
import type { Matchs } from "../../events.ts";

export async function deleteMatchHandler(req: Request, res: Response) {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const userId = session.user.id
		const currentMatches = req.app.get("currentMatches") as Map<string, Matchs>

		if (!currentMatches.get(userId))
			return res.status(400).json({ok: false, code: "host_err_no_match"})

		currentMatches.delete(userId)
		res.json({ ok: true })
	} catch (err) {
		res.status(401).json({ ok: false })
	}
}