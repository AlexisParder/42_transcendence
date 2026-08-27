import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db/client.ts"
import { username } from "better-auth/plugins"

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	emailAndPassword: { enabled: true },
	trustedOrigins: ["http://localhost:5173"],
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 25,
		})
	]
})