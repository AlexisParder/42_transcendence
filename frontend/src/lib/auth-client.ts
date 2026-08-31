import { inferAdditionalFields, twoFactorClient, usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { auth } from "../../../backend/src/auth"

export const authClient = createAuthClient({
	baseURL: "http://localhost:3000",
	plugins: [
		usernameClient(),
		twoFactorClient(),
		inferAdditionalFields<typeof auth>()
	]
})