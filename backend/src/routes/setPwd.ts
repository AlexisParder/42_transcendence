import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import type {Request, Response} from "express"

export async function setPwdHandler(req: Request, res: Response) {
	const {newPassword} = await req.body

	await auth.api.setPassword({
		body: {newPassword},
		headers: fromNodeHeaders(req.headers)
	})

	res.json({ ok: true })
}