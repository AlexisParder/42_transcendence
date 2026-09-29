import express from "express"
import cors from "cors"
import { fromNodeHeaders, toNodeHandler } from "better-auth/node"
import { auth } from "./auth.ts"
import { setPwdHandler } from "./routes/setPwd.route.ts"
import { checkPwdHandler } from "./routes/checkPwd.route.ts"
import { getBackupCodesHandler } from "./routes/getBackupCodes.route.ts"
import { createServer } from "node:http"
import { Server } from "socket.io"
import type { ClientToServerEvents, Matchs, ServerToClientEvents, SocketData } from "./events.ts"
import { prisma } from "./db/client.ts"
import { getConvHistoryHandler } from "./routes/getConvHistory.route.ts"
import { getFriendsHandler } from "./routes/getFriends.route.ts"
import { sendFriendRequestHandler } from "./routes/sendFriendRequest.route.ts"
import { acceptFriendRequestHandler } from "./routes/acceptFriendRequest.route.ts"
import { declineFriendRequestHandler } from "./routes/declineFriendRequest.route.ts"
import { getFriendsPendingHandler } from "./routes/getFriendsPending.route.ts"
import { getConverstionsHandler } from "./routes/getConversations.route.ts"
import { setReadHandler } from "./routes/setRead.route.ts"
import { blockUserHandler } from "./routes/blockUser.route.ts"
import { unblockUserHandler } from "./routes/unblockUser.route.ts"
import { getBlockedHandler } from "./routes/getBlocked.route.ts"
import { getUserStatsHandler } from "./routes/getUserStats.route.ts"
import { getUserInfoHandler } from "./routes/getUserInfo.route.ts"
import { getSentHandler, setSentHandler } from "./routes/optCooldown.route.ts"
import { getNotificationsHandler } from "./routes/getNotifications.route.ts"
import { setNotificationReadHandler } from "./routes/setNotificationRead.route.ts"
import { setAllNotificationsReadHandler } from "./routes/setAllNotificationsRead.route.ts"
import { deleteNotificationHandler } from "./routes/deleteNotification.route.ts"
import { deleteAllNotificationsHandler } from "./routes/deleteAllNotifications.route.ts"
import { getLeaderboardInfosHandler } from "./routes//getLeaderboardInfos.route.ts"
import { leaderboardLimit } from "./rateLimit.ts"
import { notificationPreferencesHandler } from "./routes/notificationPreferences.route.ts"
import { notify } from "./lib/notify.ts"
import { getPublicMatchesHandler } from "./routes/matches/getPublicMatches.route.ts"

const app = express()
const server = createServer(app)
const onlineUsers = new Map<string, number>()
const activityStatus = new Map<string, "available" | "away">()
const currentMatches = new Map<string, Matchs>()
const allowedOrigins = (process.env.CORS_ORIGIN ?? "").split(",")
const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
	cors: {
		origin: allowedOrigins,
		credentials: true
	}
})

app.set("io", io)
app.set("onlineUsers", onlineUsers)
app.set("activityStatus", activityStatus)
app.set("currentMatches", currentMatches)

// debug
const MatchTest: Matchs = {
	mode: "FOUR_FFA",
	isRanked: true,
	startedAt: "",
	endedAt: (Date.now() + 846445454).toString(),
	hostId: "dadad",
	hostUsername: "Bob",
	hostImage: '',
	visibility: "public",
	maxPlayers: 4,
	settings: {
		time_turn: 30,
		abilities: true,
		replace: true,
		spectators: true
	},
	players: [
		{ userID: "1", isBot: false, team: 1, placement: 1, points: 50, leftAt: null, status: "PLAYED", shotsHit: 5, shotsTotal: 8 },
		{ userID: "2", isBot: false, team: 2, placement: 2, points: 20, leftAt: null, status: "PLAYED", shotsHit: 3, shotsTotal: 15 }
	]
}
const MatchTest2: Matchs = {
	mode: "FOUR_FFA",
	isRanked: true,
	startedAt: "",
	endedAt: (Date.now() + 846445454).toString(),
	hostId: "wqqwq",
	hostUsername: "alfred",
	hostImage: '',
	visibility: "private",
	maxPlayers: 4,
	settings: {
		time_turn: 30,
		abilities: true,
		replace: true,
		spectators: true
	},
	players: [
		{ userID: "1", isBot: false, team: 1, placement: 1, points: 50, leftAt: null, status: "PLAYED", shotsHit: 5, shotsTotal: 8 },
		{ userID: "2", isBot: false, team: 2, placement: 2, points: 20, leftAt: null, status: "PLAYED", shotsHit: 3, shotsTotal: 15 }
	]
}
const MatchTest3: Matchs = {
	mode: "ONE_V_ONE",
	isRanked: true,
	startedAt: Date.now().toString(),
	endedAt: (Date.now() + 846445454).toString(),
	hostId: "eqwqwdqwd",
	hostUsername: "michel",
	hostImage: '',
	visibility: "public",
	maxPlayers: 2,
	settings: {
		time_turn: 30,
		abilities: true,
		replace: true,
		spectators: true
	},
	players: [
		{ userID: "1", isBot: false, team: 1, placement: 1, points: 50, leftAt: null, status: "PLAYED", shotsHit: 5, shotsTotal: 8 },
		{ userID: "2", isBot: false, team: 2, placement: 2, points: 20, leftAt: null, status: "PLAYED", shotsHit: 3, shotsTotal: 15 }
	]
}

currentMatches.set("test", MatchTest)
currentMatches.set("test2", MatchTest2)
currentMatches.set("test3", MatchTest3)
// fin debug

app.use(cors({
	origin: allowedOrigins,
	credentials: true,
}))

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(express.json())

app.get("/api/get-friends", getFriendsHandler)
app.get("/api/get-friends-pending", getFriendsPendingHandler)
app.get("/api/notifications", getNotificationsHandler)
app.get("/api/get-matches", getPublicMatchesHandler)
app.get("/api/notification-preferences", notificationPreferencesHandler)
app.patch("/api/notification-preferences", notificationPreferencesHandler)

app.post("/api/set-pwd", setPwdHandler)
app.post("/api/check-pwd", checkPwdHandler)
app.post("/api/view-codes", getBackupCodesHandler)
app.post("/api/get-conv-history", getConvHistoryHandler)
app.post("/api/send-friend-request", sendFriendRequestHandler)
app.post("/api/accept-friend-request", acceptFriendRequestHandler)
app.post("/api/decline-friend-request", declineFriendRequestHandler)
app.post("/api/get-conversations", getConverstionsHandler)
app.post("/api/set-read", setReadHandler)
app.post("/api/notifications/read", setNotificationReadHandler)
app.post("/api/notifications/read-all", setAllNotificationsReadHandler)
app.post("/api/notifications/delete", deleteNotificationHandler)
app.post("/api/notifications/delete-all", deleteAllNotificationsHandler)
app.post("/api/block-user", blockUserHandler)
app.post("/api/unblock-user", unblockUserHandler)
app.post("/api/get-blocked", getBlockedHandler)
app.post("/api/get-user-info", getUserInfoHandler)
app.post("/api/get-user-stats", getUserStatsHandler)
app.post("/api/opt/cooldown", getSentHandler)
app.post("/api/opt/send", setSentHandler)
app.post("/api/get-leaderboard-infos", leaderboardLimit, getLeaderboardInfosHandler)

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

io.on("connection", async (socket) => {
	const userId = socket.data.userId

	socket.on("set_active_conversation", (peerId) => {
		socket.data.activeConversationPeerId = typeof peerId === "string" ? peerId : null
	})

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
						{ userId: fromUserId, targetId: toUserId },
						{ userId: toUserId, targetId: fromUserId },
					]
				}
			})

			if (!areFriends)
				return

			const blocked = await prisma.userBlocked.findFirst({
				where: { userId: toUserId, targetId: fromUserId },
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
			const recipientSockets = await io.in(toUserId).fetchSockets()
			if (!recipientSockets.some(recipient => recipient.data.activeConversationPeerId === fromUserId))
				void notify(io, { userId: toUserId, type: "MESSAGE", message: `New message: ${message}` })
		} catch (err) {
			console.error("send_message error:", err)
		}
	})

	socket.join(userId)

	const before = onlineUsers.get(userId) ?? 0
	onlineUsers.set(userId, before + 1)

	if (before === 0) {
		activityStatus.set(userId, "available")
		await notifyFriendsOfPresence(userId, "available")
	}

	socket.on("set_activity", async (payload) => {
		if (!onlineUsers.has(userId))
			return

		activityStatus.set(userId, payload.status)
		await notifyFriendsOfPresence(userId, payload.status)
	})

	socket.on("disconnect", async () => {
		const count = onlineUsers.get(userId) ?? 0
		if (count <= 1) {
			onlineUsers.delete(userId)
			activityStatus.delete(userId)
			await notifyFriendsOfPresence(userId, "offline")
		} else
			onlineUsers.set(userId, count - 1)
	})
})

const PORT = 3000
server.listen(PORT, () => console.log(`Backend listening on port ${PORT}`))

async function notifyFriendsOfPresence(userId: string, status: "available" | "away" | "offline") {
	const rows = await prisma.friends.findMany({
		where: {
			isAccepted: true,
			OR: [
				{ userId },
				{ targetId: userId }
			]
		},
		select: { userId: true, targetId: true }
	})

	for (const row of rows) {
		const friendId = row.userId === userId ? row.targetId : row.userId
		io.to(friendId).emit("presence_update", { userId, status })
	}
}
