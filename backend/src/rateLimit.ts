import rateLimit from "express-rate-limit"

function createLimit(windowMs: number, limit: number) {
	return rateLimit({
		windowMs,
		limit,
		standardHeaders: true,
		legacyHeaders: true,
		message: { ok: false, error: "txt_err_too_many_requests", code: "txt_err_too_many_requests" }
	})
}

export const leaderboardLimit = createLimit(60000, 30)
export const otpLimit = createLimit(60000, 5)
export const checkPwdLimit = createLimit(60000, 5)
export const joinCodeLimit = createLimit(60000, 10)
export const friendRequestLimit = createLimit(60000, 10)
