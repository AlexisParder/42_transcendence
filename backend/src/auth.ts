import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db/client.ts"
import { sendMail } from "./lib/mail.ts"
import { getUserLanguage, resolveLanguage, t } from "./lib/translate.ts"
import { twoFactor, username, emailOTP } from "better-auth/plugins"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { notifyNewSession, notifySecurity } from "./lib/notify.ts"

const signInPaths = [
	"/sign-in/email",
	"/callback/:id",
	"/two-factor/verify-totp",
	"/two-factor/verify-backup-code",
]

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
	},
	emailVerification: {
		autoSignInAfterVerification: true,
	},
	user: {
		deleteUser: {
			enabled: true,
			// beforeDelete: async (user, request) => {
			// 	// ajouter la logique pour les historiques en mettant "Anonyme"
			// },
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
		after: createAuthMiddleware(async ctx => {
			// newSession n'est défini que si la connexion a réussi (le callback OAuth finit toujours par un redirect, donc pas de test sur APIError ici)
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
					if (user.username) return { data: user }

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

					return { data: { ...user, username: candidate, displayUsername: candidate } }
				}
			},
		},
	},
})