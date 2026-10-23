import { randomUUID } from "node:crypto"
import type { Server } from "socket.io"
import type { ClientToServerEvents, NotificationParams, ServerToClientEvents, SocketData } from "../events.ts"
import { prisma } from "../db/client.ts"
import { sendMail } from "./mail.ts"
import { defaultNotificationPreferences } from "./notificationPreferences.ts"
import { t } from "./translate.ts"

export const defaultNotificationTime = 5000

type NotificationCategory = "friend" | "chat"

type NotificationInput = {
	userId: string
	fromUserId?: string
	title: string
	description: string
	params?: NotificationParams
	time?: number
	save?: boolean
	category?: NotificationCategory
	requestId?: string
}

function email(category: NotificationCategory, language: string) {
	return {
		subject: t(language, `mail_${category}_subject`),
		html: t(language, `mail_${category}_body`),
	}
}

export function withUsername(params: NotificationParams | undefined, username: string | null | undefined): NotificationParams {
	return { ...params, username: username ?? "?" }
}

async function emitNotification(
	io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
	input: NotificationInput,
) {
	const content = { fromUserId: input.fromUserId, title: input.title, description: input.description }
	const notification = input.save
		? await prisma.notification.create({ data: { userId: input.userId, ...content, params: input.params } })
		: { id: randomUUID(), read: false, createdAt: new Date() }

	const sender = input.fromUserId
		? await prisma.user.findUnique({ where: { id: input.fromUserId }, select: { username: true } })
		: null

	io.to(input.userId).emit("notification_received", {
		...content,
		id: notification.id,
		read: notification.read,
		createdAt: notification.createdAt.toISOString(),
		params: input.fromUserId ? withUsername(input.params, sender?.username) : input.params,
		time: input.time ?? defaultNotificationTime,
		requestId: input.requestId,
	})
}

export async function notify(
	io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
	input: NotificationInput,
) {
	try {
		const recipient = await prisma.user.findUnique({
			where: { id: input.userId },
			select: { email: true, emailVerified: true, language: true, notificationPreferences: true },
		})
		if (!recipient) return
		const preferences = recipient.notificationPreferences ?? defaultNotificationPreferences
		const category = input.category
		const jobs: Promise<void>[] = []
		if (!category || preferences[`app_${category}`])
			jobs.push(emitNotification(io, input))
		if (category && preferences[`email_${category}`] && recipient.emailVerified)
			jobs.push(sendMail({ to: recipient.email, ...email(category, recipient.language) }))
		const results = await Promise.allSettled(jobs)
		for (const result of results) if (result.status === "rejected") console.error("notification delivery error:", result.reason)
	} catch (error) {
		console.error("notification delivery error:", error)
	}
}
