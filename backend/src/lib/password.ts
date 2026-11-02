import { ZxcvbnFactory } from "@zxcvbn-ts/core"
import * as common from "@zxcvbn-ts/language-common"
import * as en from "@zxcvbn-ts/language-en"
import * as fr from "@zxcvbn-ts/language-fr"

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
const PASSWORD_MIN_SCORE = 3

const zxcvbn = new ZxcvbnFactory({
	dictionary: { ...common.dictionary, ...en.dictionary, ...fr.dictionary },
	graphs: common.adjacencyGraphs,
	translations: en.translations
})

type PasswordError = "too_short" | "too_long" | "too_weak"

export const PASSWORD_MESSAGES: Record<PasswordError, string> = {
	too_short: "too short",
	too_long: "too long",
	too_weak: "too weak",
}

export function validatePassword(password: string, userInputs: string[] = []): PasswordError | null {
	if (password.length < PASSWORD_MIN_LENGTH)
		return "too_short"
	if (password.length > PASSWORD_MAX_LENGTH)
		return "too_long"
	if (zxcvbn.check(password, userInputs).score < PASSWORD_MIN_SCORE)
		return "too_weak"
	return null
}