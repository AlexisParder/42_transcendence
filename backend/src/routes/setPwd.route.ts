import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type {Request, Response} from "express"
import { isString } from "../lib/validate.ts"
import { validatePassword } from "../lib/password.ts"
import { notifySecurity } from "../lib/notify.ts"

export async function setPwdHandler(req: Request, res: Response) {
	const { newPassword } = req.body ?? {}

	if (!isString(newPassword))
		return res.status(400).json({ ok: false })

	try {
		const headers = fromNodeHeaders(req.headers)
		const session = await auth.api.getSession({ headers })

		if (!session)
			return res.status(401).json({ ok: false })

		if (validatePassword(newPassword, [session.user.email]))
			return res.status(400).json({ ok: false })

		await auth.api.setPassword({
			body: {newPassword},
			headers
		})

		notifySecurity(session.user.id, "password_changed")
		res.json({ ok: true })
	} catch {
		res.status(400).json({ ok: false })
	}
}
