import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db/client.ts"
import { sendMail } from "./lib/mail.ts"
import { twoFactor, username, emailOTP } from "better-auth/plugins"

export const auth = betterAuth({
	appName: "Sonar",
	baseURL: process.env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	trustedOrigins: ["http://localhost:5173"],
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
		requireEmailVerification: true
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		expiresIn: 3600,
	},
	user: {
		deleteUser: {
			enabled: true,
			beforeDelete: async (user, request) => {
				// ajouter la logique pour les historiques en mettant "Anonyme"
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
				input: true
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
			sendVerificationOTP: async ({ email, otp }) => {
				await sendMail({
					to: email,
					subject: "Your Sonar code",
					html: `<p>Your code: <strong>${otp}</strong></p>`,
				})
			},
		})
	],
	databaseHooks: {
		user: {
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