import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type { Request, Response } from "express"
import { isString } from "../lib/validate.ts"

export async function getBackupCodesHandler(req: Request, res: Response) {
	const { password } = req.body ?? {}

	if (!isString(password))
		return res.status(400).json({ ok: false })

	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers)
		})

		if (!session)
			return res.status(401).json({ ok: false })

		const check = await auth.api.verifyPassword({
			body: { password },
			headers: fromNodeHeaders(req.headers)
		})
		if (!check.status)
			return res.status(401).json({ ok: false })

		const data = await auth.api.viewBackupCodes({
			body: { userId: session.user.id }
		})

		res.json({ ok: true, backupCodes: data.backupCodes })
	} catch (error) {
		res.status(401).json({ ok: false })
	}
}