import { authClient } from "./auth-client"

export const SignGoogle = async () => {
	await authClient.signIn.social({
		provider: "google",
		callbackURL: `${window.location.origin}/`
	})
}