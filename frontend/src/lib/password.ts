import type { ZxcvbnFactory } from "@zxcvbn-ts/core"
import { t } from "./translate"

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
export const PASSWORD_MIN_SCORE = 3

export const PASSWORD_MESSAGES: Record<PasswordError, string> = {
	too_short: t("txt_err_pwd_too_short", {PASSWORD_MIN_LENGTH}),
	too_long: t("txt_err_pwd_too_long", {PASSWORD_MAX_LENGTH}),
	too_weak: t("txt_err_pwd_too_weak"),
}

// Les dictionnaires pèsent plusieurs Mo : ils sont chargés à la demande, dans un fichier séparé.
// Tant qu'ils ne sont pas chargés, seule la longueur est vérifiée (le serveur vérifie la robustesse).
let zxcvbn: ZxcvbnFactory | null = null
let loading: Promise<void> | null = null

export function isPasswordCheckerReady() {
	return zxcvbn !== null
}

export function loadPasswordChecker() {
	loading ??= Promise.all([
		import("@zxcvbn-ts/core"),
		import("@zxcvbn-ts/language-common"),
		import("@zxcvbn-ts/language-en"),
		import("@zxcvbn-ts/language-fr"),
	]).then(([core, common, en, fr]) => {
		zxcvbn = new core.ZxcvbnFactory({
			dictionary: { ...common.dictionary, ...en.dictionary, ...fr.dictionary },
			graphs: common.adjacencyGraphs,
			translations: en.translations
		})
	})
	return loading
}

export type PasswordError = "too_short" | "too_long" | "too_weak"

export function getPasswordScore(password: string, userInputs: string[] = []): number {
	if (!zxcvbn) {
		void loadPasswordChecker()
		return 0
	}
	return zxcvbn.check(password, userInputs).score
}

export function validatePassword(password: string, userInputs: string[] = []): PasswordError | null {
	if (password.length < PASSWORD_MIN_LENGTH)
		return "too_short"
	if (password.length > PASSWORD_MAX_LENGTH)
		return "too_long"
	if (zxcvbn && getPasswordScore(password, userInputs) < PASSWORD_MIN_SCORE)
		return "too_weak"
	return null
}