import { defaultNotificationPreferences } from "./notificationPreferences.ts"
import type { NotificationPreferences } from "./notificationPreferences.ts"
import type { NotificationEvent } from "../events.ts"

type NotificationInput = {
	userId: string
	type: "MESSAGE" | "FRIEND_REQUEST"
	message: string
	requestId?: string
}

type Delivery = {
	getRecipient: (userId: string) => Promise<{
		email: string
		emailVerified: boolean
		notificationPreferences: NotificationPreferences | null
	} | null>
	create: (input: { userId: string, type: string, message: string }) => Promise<NotificationEvent>
	emit: (userId: string, notification: NotificationEvent) => void
	sendEmail: (input: { to: string, subject: string, html: string }) => Promise<void>
	onError: (error: unknown) => void
}

export async function deliverNotification(input: NotificationInput, delivery: Delivery) {
	try {
		const recipient = await delivery.getRecipient(input.userId)
		if (!recipient) return
		const preferences = recipient.notificationPreferences ?? defaultNotificationPreferences
		const category = input.type === "MESSAGE" ? "chat" : "friend"
		const jobs: Promise<void>[] = []
		if (preferences[`app_${category}`]) {
			jobs.push((async () => {
				const notification = await delivery.create({
					userId: input.userId, type: input.type, message: input.message,
				})
				delivery.emit(input.userId, { ...notification, requestId: input.requestId })
			})())
		}
		if (preferences[`email_${category}`] && recipient.emailVerified) {
			jobs.push(delivery.sendEmail({
				to: recipient.email,
				subject: input.type === "MESSAGE" ? "SONAR — New message" : "SONAR — Friend request",
				html: input.type === "MESSAGE"
					? "<p>You have a new message. Open SONAR to read it.</p>"
					: "<p>You have a new friend request. Open SONAR to respond.</p>",
			}))
		}
		const results = await Promise.allSettled(jobs)
		for (const result of results) if (result.status === "rejected") delivery.onError(result.reason)
	} catch (error) {
		delivery.onError(error)
	}
}
