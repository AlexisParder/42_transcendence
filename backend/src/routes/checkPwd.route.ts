import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type { Request, Response } from "express"

export async function checkPwdHandler(req: Request, res: Response) {
	const { password } = req.body

	if (!password)
		return res.status(400).json({ ok: false })

	try {
		const check = await auth.api.verifyPassword({
			body: { password },
			headers: fromNodeHeaders(req.headers)
		})
		res.json({ ok: check.status })
	} catch {
		res.status(401).json({ ok: false })
	}
}