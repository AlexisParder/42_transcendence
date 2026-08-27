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
	]
})