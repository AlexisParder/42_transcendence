import { emailOTPClient, inferAdditionalFields, twoFactorClient, usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
	baseURL: `${window.location.origin}/api/auth`,
	plugins: [
		usernameClient(),
		twoFactorClient({
			twoFactorPage: "/two-factor"
		}),
		inferAdditionalFields({
			user: {
				language: {type: "string"},
				points: {type: "number"},
			}
		}),
		emailOTPClient(),
	]
})