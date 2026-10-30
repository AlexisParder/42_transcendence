import { t } from "./translate"

export function ordinal(n: number): string {
	const s = [t("txt_th"), t("txt_st"), t("txt_nd"), t("txt_rd")]
	const v = n % 100
	return n + (s[(v - 20) % 10] || s[v] || s[0])
}