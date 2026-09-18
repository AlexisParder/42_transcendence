import type { Request, Response } from "express"
import { auth } from "../auth.ts"

const lastSent = new Map<string, number>();
const COOLDOWN_TIME = 60000;

function leftFor(email: string) {
	const last = lastSent.get(email.toLowerCase()) ?? 0;
	return Math.max(0, Math.floor((last + COOLDOWN_TIME - Date.now()) / 1000));
}

export async function getSentHandler(req: Request, res: Response) {
	const { email } = req.body;
	if (!email) {
		return res.status(400).json({ ok: false, error: "missing_email" });
	}

	res.json({ ok: true, left: leftFor(email) });
}

export async function setSentHandler(req: Request, res: Response) {
	const { email } = req.body;
	if (!email) {
		return res.status(400).json({ ok: false, error: "missing_email" });
	}

	const left = leftFor(email);
	if (left > 0) {
		return res.status(429).json({ ok: false, error: "cooldown" });
	}

	await auth.api.sendVerificationOTP({
		body: { email, type: "email-verification" },
	})

	lastSent.set(email.toLowerCase(), Date.now());

	res.json({ ok: true, left: COOLDOWN_TIME / 1000 });
}
