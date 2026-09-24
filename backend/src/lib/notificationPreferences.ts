export const defaultNotificationPreferences = {
	app_friend: true,
	app_chat: true,
	email_friend: false,
	email_chat: false,
}

export type NotificationPreferences = typeof defaultNotificationPreferences

export function parseNotificationPreferences(body: unknown): Partial<NotificationPreferences> | null {
	if (!body || typeof body !== "object" || Array.isArray(body)) return null
	const entries = Object.entries(body)
	if (!entries.length || entries.some(([key, value]) =>
		!Object.hasOwn(defaultNotificationPreferences, key) || typeof value !== "boolean"
	)) return null
	return Object.fromEntries(entries)
}
