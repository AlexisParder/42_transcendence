import { randomUUID } from "node:crypto"
import type { Server } from "socket.io"
import type { ClientToServerEvents, NotificationParams, ServerToClientEvents, SocketData } from "../events.ts"
import { prisma } from "../db/client.ts"
import { sendMail } from "./mail.ts"
import { defaultNotificationPreferences } from "./notificationPreferences.ts"
import { t } from "./translate.ts"
import { io } from "../server.ts"

export const defaultNotificationTime = 5000

type NotificationCategory = "friend" | "chat" | "achievements" | "security"

export type SecurityEvent = "password_changed" | "2fa_enabled" | "2fa_disabled" | "new_session"


type NotificationInput = {
	userId: string
	fromUserId?: string
	title: string
	description: string
	params?: NotificationParams
	time?: number
	save?: boolean
	category?: NotificationCategory
	mail?: string
	requestId?: string
}

function escapeHtml(value: string | number) {
	return String(value).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)
}

function email(key: string, language: string, params?: NotificationParams) {
	const vars = params && Object.fromEntries(Object.entries(params).map(([k, v]) => [k, escapeHtml(v)]))
	return {
		subject: t(language, `mail_${key}_subject`),
		html: t(language, `mail_${key}_body`, vars),
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
			jobs.push(sendMail({ to: recipient.email, ...email(input.mail ?? category, recipient.language, input.params) }))
		const results = await Promise.allSettled(jobs)
		for (const result of results) if (result.status === "rejected") console.error("notification delivery error:", result.reason)
	} catch (error) {
		console.error("notification delivery error:", error)
	}
}

export function notifySecurity(userId: string, event: SecurityEvent, params?: NotificationParams) {
	void notify(io, {
		userId,
		title: "notifications_security",
		description: `notifications_security_${event}`,
		params,
		save: true,
		category: "security",
		mail: `security_${event}`,
	})
}

function describeBrowser(userAgent: string) {
	const browser = /Edg\//.test(userAgent) ? "Edge"
		: /OPR\//.test(userAgent) ? "Opera"
		: /Firefox\//.test(userAgent) ? "Firefox"
		: /Chrome\//.test(userAgent) ? "Chrome"
		: /Safari\//.test(userAgent) ? "Safari"
		: "?"
	const os = /Windows/.test(userAgent) ? "Windows"
		: /Android/.test(userAgent) ? "Android"
		: /iPhone|iPad/.test(userAgent) ? "iOS"
		: /Mac OS X/.test(userAgent) ? "macOS"
		: /Linux/.test(userAgent) ? "Linux"
		: "?"
	return `${browser} (${os})`
}

export function notifyNewSession(userId: string, session: { ipAddress?: string | null, userAgent?: string | null }) {
	notifySecurity(userId, "new_session", {
		device: describeBrowser(session.userAgent ?? ""),
		ip: session.ipAddress || "?",
	})
}
