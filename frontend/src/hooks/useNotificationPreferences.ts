import { useEffect, useRef, useState } from "react"
import { t } from "../lib/translate"

export type NotificationPreferences = {
	app_friend: boolean
	app_chat: boolean
	email_friend: boolean
	email_chat: boolean
}

export function useNotificationPreferences(userId?: string) {
	const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState("")
	const [saved, setSaved] = useState(false)
	const busy = useRef(false)
	const activeUser = useRef(userId)

	useEffect(() => {
		activeUser.current = userId
		if (!userId) return
		const controller = new AbortController()
		fetch("/api/notification-preferences", { credentials: "include", signal: controller.signal })
			.then(async response => {
				if (!response.ok) throw new Error("load failed")
				const data = await response.json()
				if (!controller.signal.aborted) setPreferences(data.preferences)
			})
			.catch(() => {
				if (!controller.signal.aborted) setError(t("settings_notif_load_error"))
			})
		return () => { controller.abort(); activeUser.current = undefined }
	}, [userId])

	async function update(key: keyof NotificationPreferences, value: boolean) {
		if (!preferences || busy.current || !userId) return
		busy.current = true
		setSaving(true)
		setSaved(false)
		setError("")
		try {
			const response = await fetch("/api/notification-preferences", {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [key]: value }),
			})
			if (!response.ok) throw new Error("save failed")
			const data = await response.json()
			if (activeUser.current !== userId) return
			setPreferences(data.preferences)
			setSaved(true)
		} catch {
			if (activeUser.current === userId) setError(t("settings_notif_save_error"))
		} finally {
			busy.current = false
			if (activeUser.current === userId) setSaving(false)
		}
	}
	return { preferences, saving, saved, error, update }
}
