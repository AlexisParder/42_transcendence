import { t } from "./translate"

export function formatTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const min = Math.floor(diff / 60000)
	if (min < 1)
		return "now"
	if (min < 60)
		return `${min} min`

	const h = Math.floor(min / 60)
	if (h < 24)
		return `${h} h`
	return `${Math.floor(h / 24)} ${t("txt_day_u")}`
}