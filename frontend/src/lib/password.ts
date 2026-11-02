import { ZxcvbnFactory } from "@zxcvbn-ts/core"
import * as common from "@zxcvbn-ts/language-common"
import * as en from "@zxcvbn-ts/language-en"
import * as fr from "@zxcvbn-ts/language-fr"
import { t } from "./translate"

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
export const PASSWORD_MIN_SCORE = 3

export const PASSWORD_MESSAGES: Record<PasswordError, string> = {
	too_short: t("txt_err_pwd_too_short", {PASSWORD_MIN_LENGTH}),
	too_long: t("txt_err_pwd_too_long", {PASSWORD_MAX_LENGTH}),
	too_weak: t("txt_err_pwd_too_weak"),
}

const zxcvbn = new ZxcvbnFactory({
	dictionary: { ...common.dictionary, ...en.dictionary, ...fr.dictionary },
	graphs: common.adjacencyGraphs,
	translations: en.translations
})

export type PasswordError = "too_short" | "too_long" | "too_weak"

export function getPasswordScore(password: string, userInputs: string[] = []): number {
	return zxcvbn.check(password, userInputs).score
}

export function validatePassword(password: string, userInputs: string[] = []): PasswordError | null {
	if (password.length < PASSWORD_MIN_LENGTH)
		return "too_short"
	if (password.length > PASSWORD_MAX_LENGTH)
		return "too_long"
	if (getPasswordScore(password, userInputs) < PASSWORD_MIN_SCORE)
		return "too_weak"
	return null
}