import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db/client.ts"
import { username } from "better-auth/plugins"

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	emailAndPassword: { enabled: true },
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
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 25,
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