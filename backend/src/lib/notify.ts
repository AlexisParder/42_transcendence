import type { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../events.ts"
import { prisma } from "../db/client.ts"
import { sendMail } from "./mail.ts"
import { deliverNotification } from "./deliverNotification.ts"

export function notify(
	io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
	input: Parameters<typeof deliverNotification>[0],
) {
	return deliverNotification(input, {
		getRecipient: userId => prisma.user.findUnique({
			where: { id: userId },
			select: { email: true, emailVerified: true, notificationPreferences: true },
		}),
		create: async data => {
			const row = await prisma.notification.create({ data })
			return { ...row, createdAt: row.createdAt.toISOString() }
		},
		emit: (userId, notification) => { io.to(userId).emit("notification_received", notification) },
		sendEmail: sendMail,
		onError: error => console.error("notification delivery error:", error),
	})
}
