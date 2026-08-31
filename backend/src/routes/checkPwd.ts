import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type {Request, Response} from "express"

export async function checkPwdHandler(req: Request, res: Response) {
	const {currPassword} = await req.body

	const {  } = await auth.api.verifyPassword({
		body: {
			password: currPassword
		},
		headers: fromNodeHeaders(req.headers)
	})

	res.json({ ok: true })
}