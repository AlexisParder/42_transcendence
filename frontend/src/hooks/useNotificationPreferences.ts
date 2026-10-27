import { useEffect, useState } from "react"
import { t } from "../lib/translate"
import { apiGet, apiPost } from "../lib/api"

export type NotificationPreferences = {
	app_friend: boolean
	app_chat: boolean
	app_achievements: boolean
	app_security: boolean
	email_friend: boolean
	email_chat: boolean
	email_achievements: boolean
	email_security: boolean
}

export function useNotificationPreferences(userId?: string) {
	const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState("")

	useEffect(() => {
		if (!userId)
			return

		apiGet("/api/notification-preferences")
			.then(({ ok, data }) => ok ? setPreferences(data.preferences) : setError(t("settings_notif_load_error")))
			.catch(() => setError(t("settings_notif_load_error")))
	}, [userId])

	async function update(key: keyof NotificationPreferences, value: boolean) {
		setSaving(true)
		setError("")

		try {
			const { ok, data } = await apiPost("/api/notification-preferences", { [key]: value })

			if (!ok)
				return setError(t("settings_notif_save_error"))

			setPreferences(data.preferences)
		} catch {
			setError(t("settings_notif_save_error"))
		} finally {
			setSaving(false)
		}
	}

	return { preferences, saving, error, update }
}
