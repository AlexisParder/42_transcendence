import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type {Request, Response} from "express"
import { isString } from "../lib/validate.ts"

export async function setPwdHandler(req: Request, res: Response) {
	const { newPassword } = req.body ?? {}

	if (!isString(newPassword))
		return res.status(400).json({ ok: false })

	try {
		await auth.api.setPassword({
			body: {newPassword},
			headers: fromNodeHeaders(req.headers)
		})

		res.json({ ok: true })
	} catch {
		res.status(400).json({ ok: false })
	}
}
