import type { NotificationEvent, NotificationParams } from "../types/events"

const notificationTime = 5000

type NotificationInput = {
	title: string
	description: string
	params?: NotificationParams
}

type NotificationListener = (notification: NotificationEvent) => void

const listeners = new Set<NotificationListener>()
let localId = 0

export function onNotification(listener: NotificationListener) {
	listeners.add(listener)
	return () => { listeners.delete(listener) }
}

export function sendNotification({ title, description, params }: NotificationInput) {
	const notification: NotificationEvent = {
		id: `local-${++localId}`,
		title,
		description,
		params,
		time: notificationTime,
	}

	for (const listener of listeners)
		listener(notification)
}
