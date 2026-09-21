import rateLimit from "express-rate-limit"

export const leaderboardLimit = rateLimit({
	windowMs: 60000,
	limit: 10,
	standardHeaders: true,
	legacyHeaders: true,
	message: { ok: false, error: "txt_err_too_many_requests" }
})