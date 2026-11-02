import type { Request, Response } from "express"
import { auth } from "../auth.ts"

const lastSent = new Map<string, number>();
const COOLDOWN_TIME = 60000;

function normalizeEmail(email: unknown) {
	return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function leftFor(email: string) {
	const last = lastSent.get(email) ?? 0;
	return Math.max(0, Math.floor((last + COOLDOWN_TIME - Date.now()) / 1000));
}

export async function getSentHandler(req: Request, res: Response) {
	const email = normalizeEmail(req.body?.email);
	if (!email) {
		return res.status(400).json({ ok: false, error: "missing_email" });
	}

	res.json({ ok: true, left: leftFor(email) });
}

export async function setSentHandler(req: Request, res: Response) {
	const email = normalizeEmail(req.body?.email);
	if (!email) {
		return res.status(400).json({ ok: false, error: "missing_email" });
	}

	const left = leftFor(email);
	if (left > 0) {
		return res.status(429).json({ ok: false, error: "cooldown" });
	}

	const type = req.body?.type === "forget-password" ? "forget-password" : "email-verification"

	try {
		await auth.api.sendVerificationOTP({
			body: { email, type },
		})
	} catch (error) {
		console.error("otp send error:", error)
		return res.status(500).json({ ok: false, error: "send_failed" })
	}

	lastSent.set(email, Date.now());

	res.json({ ok: true, left: COOLDOWN_TIME / 1000 });
}
