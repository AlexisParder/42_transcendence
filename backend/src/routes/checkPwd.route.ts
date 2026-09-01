import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type { Request, Response } from "express"

export async function checkPwdHandler(req: Request, res: Response) {
	const { currPassword } = await req.body

	const check = await auth.api.verifyPassword({
		body: { password: currPassword },
		headers: fromNodeHeaders(req.headers)
	})

	res.json({ ok: check })
}