export const defaultNotificationPreferences = {
	app_friend: true,
	app_chat: true,
	app_achievements: true,
	app_security: true,
	email_friend: false,
	email_chat: false,
	email_achievements: false,
	email_security: true,
}

type NotificationPreferences = typeof defaultNotificationPreferences

export function parseNotificationPreferences(body: unknown): Partial<NotificationPreferences> | null {
	if (!body || typeof body !== "object" || Array.isArray(body)) return null
	const entries = Object.entries(body)
	if (!entries.length || entries.some(([key, value]) =>
		!Object.hasOwn(defaultNotificationPreferences, key) || typeof value !== "boolean"
	)) return null
	return Object.fromEntries(entries)
}
