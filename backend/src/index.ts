import express from "express"
import cors from "cors"
import { fromNodeHeaders, toNodeHandler } from "better-auth/node"
import { auth } from "./auth.ts"
import { setPwdHandler } from "./routes/setPwd.route.ts"
import { checkPwdHandler } from "./routes/checkPwd.route.ts"
import { getBackupCodesHandler } from "./routes/getBackupCodes.route.ts"
import { createServer } from "node:http"
import { Server } from "socket.io"
import type { ClienToServerEvents, ServerToClientEvents, SocketData } from "./events.ts"
import { prisma } from "./db/client.ts"

const app = express()
const server = createServer(app)
/**
 * Server<Event ecouté, Event Emis, inter-serveur, type de socket.data>
 */
const io = new Server<ClienToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
	cors: {
		origin: "http://localhost:5173",
		credentials: true
	}
})

app.use(cors({
	origin: "http://localhost:5173", // front Vite
	credentials: true,
}))

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(express.json())

app.get("/api/test", (req, res) => {
	res.json({ status: "ok" })
})

app.post("/api/set-pwd", setPwdHandler)
app.post("/api/check-pwd", checkPwdHandler)
app.post("/api/view-codes", getBackupCodesHandler)

io.use(async (socket, next) => {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(socket.handshake.headers)
		})

		if (!session)
			return next(new Error("unauthorized"))

		socket.data.userId = session.user.id
		next()
	} catch (error) {
		next(new Error("unauthorized"))
	}
})

io.on("connection", (socket) => {
	socket.on("send_message", async (payload) => {
		try {
			const fromUserId = socket.data.userId
			const toUserId = payload.toUserId
			const message = payload.message?.trim()
			if (!message || message.length > 1000)
				return

			if (toUserId === fromUserId)
				return
			
			const areFriends = await prisma.friends.findFirst({
				where: {
					isAccepted: true,
					OR: [
						{ userId: fromUserId, targetId: toUserId},
						{ userId: toUserId, targetId: fromUserId},
					]
				}
			})

			if (!areFriends)
				return

			const blocked = await prisma.userBlocked.findFirst({
				where: {userId: toUserId, targetId: fromUserId},
			})

			if (blocked)
				return

			const row = await prisma.conversations.create({
				data: {
					userId: fromUserId,
					targetId: toUserId,
					message: message
				}
			})

			const wire = {
				id: row.id,
				fromUserId: row.userId,
				toUserId: row.targetId,
				message: row.message,
				createdAt: row.sendAt.toISOString(),
			}

			io.to(toUserId).emit("new_message", wire)
			io.to(fromUserId).emit("new_message", wire)
		} catch (err) {
			console.error("send_message error:", err)
		}
	})



	socket.join(socket.data.userId)
	console.log("Client connected: ", socket.data.userId)

	socket.on("disconnect", () => {
		console.log("Client disconnected: ", socket.data.userId)
	})
})

const PORT = 3000
server.listen(PORT, () => console.log(`Backend listening on port ${PORT}`))