import rateLimit from "express-rate-limit"

export const leaderboardLimit = rateLimit({
	windowMs: 60000,
	limit: 30,
	standardHeaders: true,
	legacyHeaders: true,
	message: { ok: false, error: "txt_err_too_many_requests" }
})
export const exportLimit = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 3,
	standardHeaders: true,
	legacyHeaders: true,
	message: { ok: false, error: "settings_err_export_too_many" }
})
