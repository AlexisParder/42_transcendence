import { apiPost } from "./api"
import type { NotificationEvent, NotificationParams } from "../types/events"

export const defaultNotificationTime = 5000

type NotificationInput = {
	title: string
	description: string
	params?: NotificationParams
	time?: number
	save?: boolean
}

type NotificationListener = (notification: NotificationEvent) => void

const listeners = new Set<NotificationListener>()
let localId = 0

export function onNotification(listener: NotificationListener) {
	listeners.add(listener)
	return () => { listeners.delete(listener) }
}

export async function sendNotification({ title, description, params, time = defaultNotificationTime, save = false }: NotificationInput) {
	const notification: NotificationEvent = {
		id: `local-${++localId}`,
		title,
		description,
		params,
		time,
		read: false,
		createdAt: new Date().toISOString(),
	}

	for (const listener of listeners)
		listener(notification)

	if (!save)
		return true

	const { ok } = await apiPost("/api/notifications/create", { title, description, params })
	return ok
}
