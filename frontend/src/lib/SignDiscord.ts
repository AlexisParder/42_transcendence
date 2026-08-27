import { authClient } from "./auth-client"

export const SignDiscord = async () => {
	await authClient.signIn.social({
		provider: "discord",
		callbackURL: `${window.location.origin}/`
	})
}