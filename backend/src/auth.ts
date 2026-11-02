import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db/client.ts"
import { sendMail } from "./lib/mail.ts"
import { getUserLanguage, isSupportedLanguage, resolveLanguage, t } from "./lib/translate.ts"
import { twoFactor, username, emailOTP } from "better-auth/plugins"
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { notifyNewSession, notifySecurity } from "./lib/notify.ts"
import { io } from "./server.ts"
import { currentMatches } from "./mapMatches.ts"
import { isInAnyMatch, isInAnySpecMatch } from "./lib/matchs/matchUtils.ts"
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MESSAGES, validatePassword } from "./lib/password.ts"
import { importAvatar, processAvatar } from "./lib/avatar.ts"

const signInPaths = [
	"/sign-in/email",
	"/callback/:id",
	"/two-factor/verify-totp",
	"/two-factor/verify-backup-code",
]

const PASSWORD_FIELDS: Record<string, string> = {
	"/sign-up/email": "password",
	"/email-otp/reset-password": "password",
	"/reset-password": "newPassword",
	"/change-password": "newPassword",
	"/set-password": "newPassword",
}

const trustedOrigins = (process.env.CORS_ORIGIN ?? "").split(",")
export const auth = betterAuth({
	appName: "Sonar",
	baseURL: process.env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	trustedOrigins,
	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24
	},
	rateLimit: {
		enabled: true
	},
	socialProviders: {
		google: {
			prompt: "select_account",
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
		discord: {
			clientId: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		revokeSessionsOnPasswordReset: true,
		minPasswordLength: PASSWORD_MIN_LENGTH,
		maxPasswordLength: PASSWORD_MAX_LENGTH,
	},
	emailVerification: {
		autoSignInAfterVerification: true,
	},
	user: {
		deleteUser: {
			enabled: true,
			beforeDelete: async (user) => {
				const friends = await prisma.friends.findMany({
					where: { OR: [{ userId: user.id }, { targetId: user.id }] },
					select: { userId: true, targetId: true }
				})
				for (const row of friends)
					io.to(row.userId === user.id ? row.targetId : row.userId).emit("friend_removed", { userId: user.id })
			},
			afterDelete: async (user) => {
				io.in(user.id).disconnectSockets(true)
			},
		},
		additionalFields: {
			language: {
				type: "string",
				required: false,
				defaultValue: "en",
				input: true
			},
			points: {
				type: "number",
				required: false,
				defaultValue: 0,
				input: false
			}
		}
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "discord"]
		}
	},
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 25,
		}),
		twoFactor(),
		emailOTP({
			otpLength: 6,
			expiresIn: 600,
			sendVerificationOTP: async ({ email, otp }, ctx) => {
				const language = await getUserLanguage({ email }) ?? resolveLanguage(ctx?.headers?.get("accept-language"))
				void sendMail({
					to: email,
					subject: t(language, "mail_otp_subject"),
					html: t(language, "mail_otp_body", { otp }),
				})
			},
		})
	],
	hooks: {
		before: createAuthMiddleware(async ctx => {
			if ((ctx.path === "/sign-up/email" || ctx.path === "/update-user") && ctx.body?.language !== undefined && !isSupportedLanguage(ctx.body.language))
				throw new APIError("BAD_REQUEST", { message: "invalid language" })

			const field = PASSWORD_FIELDS[ctx.path]
			if (field) {
				const body = (ctx.body ?? {}) as Record<string, unknown>
				const password = body[field]

				if (typeof password !== "string")
					return

				const session = await getSessionFromCtx(ctx)
				const email = session?.user.email ?? (typeof body.email === "string" ? body.email : null)

				const error = validatePassword(password, email ? [email] : [])
				if (error)
					throw new APIError("BAD_REQUEST", { message: PASSWORD_MESSAGES[error] })
				return
			}

			if (ctx.path === "/update-user" && typeof ctx.body?.image === "string") {
				const result = await processAvatar(ctx.body.image)
				if ("error" in result)
					return ctx.json({ ok: false, code: result.error }, { status: 400 })
				return { context: { body: { ...ctx.body, image: result.image } } }
			}

			if (ctx.path !== "/delete-user")
				return

			const session = await getSessionFromCtx(ctx)
			if (session && (isInAnyMatch(currentMatches, session.user.id) || isInAnySpecMatch(currentMatches, session.user.id)))
				return ctx.json({ ok: false, code: "settings_err_rmv_user_in_match" }, { status: 409 })
		}),
		after: createAuthMiddleware(async ctx => {
			const newSession = ctx.context.newSession
			if (newSession && !ctx.context.session && signInPaths.includes(ctx.path)) {
				const isNewAccount = Date.now() - new Date(newSession.user.createdAt).getTime() < 60_000
				if (!isNewAccount)
					notifyNewSession(newSession.user.id, newSession.session)
			}

			if (ctx.context.returned instanceof APIError)
				return

			if (ctx.path === "/change-password" || ctx.path === "/set-password") {
				const userId = ctx.context.session?.user.id
				if (userId)
					notifySecurity(userId, "password_changed")
			}

			if (ctx.path === "/email-otp/reset-password" && typeof ctx.body?.email === "string") {
				const user = await prisma.user.findUnique({ where: { email: ctx.body.email.toLowerCase() }, select: { id: true } })
				if (user)
					notifySecurity(user.id, "password_changed")
			}
		}),
	},
	databaseHooks: {
		user: {
			update: {
				after: async (user, ctx) => {
					if (ctx?.path === "/two-factor/disable")
						notifySecurity(user.id, "2fa_disabled")
					else if (ctx?.path === "/two-factor/verify-totp" && user.twoFactorEnabled)
						notifySecurity(user.id, "2fa_enabled")
				}
			},
			create: {
				before: async (user, ctx) => {
					const image = await importAvatar(user.image)
					if (user.username) return { data: { ...user, image } }

					const base = (user.email?.split("@")[0] ?? user.name ?? "user").toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 24) || "user"

					let candidate = base
					let i = 0
					while (await ctx?.context.adapter.findOne({
						model: "user",
						where: [{ field: "username", value: candidate }]
					})) {
						i++
						candidate = `${base}${i}`
					}

					const language = resolveLanguage(ctx?.headers?.get("accept-language"))

					return { data: { ...user, image, language, username: candidate, displayUsername: candidate } }
				}
			},
		},
	},
})