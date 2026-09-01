import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type { Request, Response } from "express"

export async function getBackupCodesHandler(req: Request, res: Response) {
	const { password } = await req.body

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