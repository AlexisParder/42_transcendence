import { getTranslationLanguage, t } from "./translate"

export function formatTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const min = Math.floor(diff / 60000)
	if (min < 1)
		return t("txt_now")
	if (min < 60)
		return `${min} min`

	const h = Math.floor(min / 60)
	if (h < 24)
		return `${h} h`
	return `${Math.floor(h / 24)} ${t("txt_day_u")}`
}

export function formatTimeProfile(min: string): string {
	const minNb = Number(min)
	if (minNb < 1)
		return t("txt_now")
	if (minNb < 60)
		return `${minNb} min`

	const h = Math.floor(minNb / 60)
	if (h < 24)
		return `${h} h`
	return `${Math.floor(h / 24)} ${t("txt_day_u")}`
}

export function formatTimeMsg(iso: string): string {
	const date = new Date(iso).toLocaleString(getTranslationLanguage())

	return date
}

export function formatMS(total: number) {
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}