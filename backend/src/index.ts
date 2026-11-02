import express from "express"
import cors from "cors"
import { fromNodeHeaders, toNodeHandler } from "better-auth/node"
import { auth } from "./auth.ts"
import { setPwdHandler } from "./routes/setPwd.route.ts"
import { checkPwdHandler } from "./routes/checkPwd.route.ts"
import { getBackupCodesHandler } from "./routes/getBackupCodes.route.ts"
import type { PresenceStatus } from "./events.ts"
import { prisma } from "./db/client.ts"
import { getConvHistoryHandler } from "./routes/friends/getConvHistory.route.ts"
import { getFriendsHandler } from "./routes/friends/getFriends.route.ts"
import { sendFriendRequestHandler } from "./routes/friends/sendFriendRequest.route.ts"
import { acceptFriendRequestHandler } from "./routes/friends/acceptFriendRequest.route.ts"
import { declineFriendRequestHandler } from "./routes/friends/declineFriendRequest.route.ts"
import { getFriendsPendingHandler } from "./routes/friends/getFriendsPending.route.ts"
import { getConverstionsHandler } from "./routes/friends/getConversations.route.ts"
import { setReadHandler } from "./routes/friends/setRead.route.ts"
import { blockUserHandler } from "./routes/friends/blockUser.route.ts"
import { unblockUserHandler } from "./routes/friends/unblockUser.route.ts"
import { getBlockedHandler } from "./routes/friends/getBlocked.route.ts"
import { getUserStatsHandler } from "./routes/getUserStats.route.ts"
import { getUserInfoHandler } from "./routes/getUserInfo.route.ts"
import { getUserAchievementsHandler } from "./routes/getUserAchievements.route.ts"
import { getSentHandler, setSentHandler } from "./routes/otpCooldown.route.ts"
import { getNotificationsHandler } from "./routes/getNotifications.route.ts"
import { setNotificationReadHandler } from "./routes/setNotificationRead.route.ts"
import { setAllNotificationsReadHandler } from "./routes/setAllNotificationsRead.route.ts"
import { deleteNotificationHandler } from "./routes/deleteNotification.route.ts"
import { deleteAllNotificationsHandler } from "./routes/deleteAllNotifications.route.ts"
import { createNotificationHandler } from "./routes/createNotification.route.ts"
import { getLeaderboardInfosHandler } from "./routes//getLeaderboardInfos.route.ts"
import { apiLimit, checkPwdLimit, friendRequestLimit, joinCodeLimit, leaderboardLimit, otpLimit } from "./rateLimit.ts"
import { getNotificationPreferencesHandler, setNotificationPreferencesHandler } from "./routes/notificationPreferences.route.ts"
import { notify } from "./lib/notify.ts"
import { allowedOrigins, app, io, server } from "./server.ts"
import { getPublicMatchesHandler } from "./routes/matches/getPublicMatches.route.ts"
import { createMatchHandler } from "./routes/matches/createMatch.route.ts"
import { deleteMatchHandler } from "./routes/matches/deleteMatch.route.ts"
import { joinMatchHandler } from "./routes/matches/joinMatch.route.ts"
import { leaveMatchHandler } from "./routes/matches/leaveMatch.route.ts"
import { updatePlayerStatusMatchHandler } from "./routes/matches/updatePlayerStatusMatch.route.ts"
import { getJoinedMatchHandler } from "./routes/matches/getJoinedMatch.route.ts"
import { kickPlayerMatchHandler } from "./routes/matches/kickPlayerMatch.route.ts"
import { joinCodeMatchHandler } from "./routes/matches/joinCodeMatch.route.ts"
import { inviteMatchHandler } from "./routes/matches/inviteMatch.route.ts"
import { playerFireHandler } from "./routes/matches/playerFire.route.ts"
import { startMatchHandler } from "./routes/matches/startMatch.route.ts"
import { setPlayerReadyOnSelectHandler, setPlayerShipsHandler } from "./routes/matches/setShips.route.ts"
import { currentMatches } from "./mapMatches.ts"
import { findActiveMatchOf } from "./lib/matchs/matchUtils.ts"
import { reconnectPlayer, startDisconnectTimer } from "./lib/matchs/disconnectTimers.ts"
import { forfeitMatchHandler } from "./routes/matches/forfeitMatch.route.ts"
import { getUserPointsHandler } from "./routes/getUserPoints.route.ts"
import { joinSpecMatchHandler } from "./routes/matches/joinSpecMatch.route.ts"
import { leaveSpecMatchHandler } from "./routes/matches/leaveSpecMatch.route.ts"
import { matchSendMessageHandler } from "./routes/matches/MatchSendMessage.route.ts"
import { exportDataHandler } from "./routes/exportData.route.ts"
import { getStatsHandler } from "./routes/getStats.route.ts"

const onlineUsers = new Map<string, number>()
const activityStatus = new Map<string, PresenceStatus>()

app.set("onlineUsers", onlineUsers)
app.set("activityStatus", activityStatus)
app.set("currentMatches", currentMatches)

app.set("trust proxy", 1)

app.use(cors({
	origin: allowedOrigins,
	credentials: true,
}))

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(express.json())
app.use("/api", apiLimit)

app.get("/api/get-friends", getFriendsHandler)
app.get("/api/get-friends-pending", getFriendsPendingHandler)
app.get("/api/notifications", getNotificationsHandler)
app.get("/api/notification-preferences", getNotificationPreferencesHandler)
app.get("/api/export-data", exportDataHandler)
app.get("/api/stats", getStatsHandler)

app.post("/api/set-pwd", setPwdHandler)
app.post("/api/check-pwd", checkPwdLimit, checkPwdHandler)
app.post("/api/view-codes", getBackupCodesHandler)
app.post("/api/get-conv-history", getConvHistoryHandler)
app.post("/api/send-friend-request", friendRequestLimit, sendFriendRequestHandler)
app.post("/api/accept-friend-request", acceptFriendRequestHandler)
app.post("/api/decline-friend-request", declineFriendRequestHandler)
app.post("/api/get-conversations", getConverstionsHandler)
app.post("/api/set-read", setReadHandler)
app.post("/api/notifications/read", setNotificationReadHandler)
app.post("/api/notifications/read-all", setAllNotificationsReadHandler)
app.post("/api/notifications/delete", deleteNotificationHandler)
app.post("/api/notification-preferences", setNotificationPreferencesHandler)
app.post("/api/notifications/delete-all", deleteAllNotificationsHandler)
app.post("/api/notifications/create", createNotificationHandler)
app.post("/api/block-user", blockUserHandler)
app.post("/api/unblock-user", unblockUserHandler)
app.post("/api/get-blocked", getBlockedHandler)
app.post("/api/get-user-info", getUserInfoHandler)
app.post("/api/get-user-points", getUserPointsHandler)
app.post("/api/get-user-stats", getUserStatsHandler)
app.post("/api/get-user-achievements", getUserAchievementsHandler)
app.post("/api/otp/cooldown", getSentHandler)
app.post("/api/otp/send", otpLimit, setSentHandler)
app.post("/api/get-leaderboard-infos", leaderboardLimit, getLeaderboardInfosHandler)
app.post("/api/get-matches", getPublicMatchesHandler)
app.post("/api/get-joined-match", getJoinedMatchHandler)
app.post("/api/join-match", joinMatchHandler)
app.post("/api/join-spec-match", joinSpecMatchHandler)
app.post("/api/join-code-match", joinCodeLimit, joinCodeMatchHandler)
app.post("/api/leave-match", leaveMatchHandler)
app.post("/api/leave-spec-match", leaveSpecMatchHandler)
app.post("/api/create-match", createMatchHandler)
app.post("/api/delete-match", deleteMatchHandler)
app.post("/api/update-player-status-match", updatePlayerStatusMatchHandler)
app.post("/api/kick-user-match", kickPlayerMatchHandler)
app.post("/api/invite-match", inviteMatchHandler)
app.post("/api/start-match", startMatchHandler)
app.post("/api/player-fire", playerFireHandler)
app.post("/api/set-player-ships", setPlayerShipsHandler)
app.post("/api/set-player-ready-on-select", setPlayerReadyOnSelectHandler)
app.post("/api/forfeit-match", forfeitMatchHandler)
app.post("/api/match-send-message", matchSendMessageHandler)

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
			const toUserId = payload?.toUserId

			if (typeof toUserId !== "string" || typeof payload.message !== "string")
				return

			const message = payload.message.trim()

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
				isRead: false
			}

			io.to(toUserId).emit("new_message", wire)
			io.to(fromUserId).emit("new_message", wire)
			const recipientSockets = await io.in(toUserId).fetchSockets()
			if (!recipientSockets.some(recipient => recipient.data.activeConversationPeerId === fromUserId))
				void notify({
					userId: toUserId,
					fromUserId,
					title: "notifications_new_message",
					description: "notifications_new_message_body",
					params: { message },
					save: true,
					category: "chat",
				})
		} catch (err) {
			console.error("send_message error:", err)
		}
	})

	socket.on("set_typing", async (payload) => {
		try {
			const fromUserId = socket.data.userId
			const toUserId = payload?.toUserId

			if (typeof toUserId !== "string" || typeof payload.typing !== "boolean")
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

			io.to(toUserId).emit("typing", {
				fromUserId,
				typing: payload.typing
			})
		} catch (err) {
			console.error("set_typing error:", err)
		}
	})

	socket.join(userId)

	const before = onlineUsers.get(userId) ?? 0
	onlineUsers.set(userId, before + 1)

	socket.on("set_activity", async (payload) => {
		if (!onlineUsers.has(userId))
			return

		if (payload?.status !== "available" && payload?.status !== "away")
			return

		activityStatus.set(userId, payload.status)
		await notifyFriendsOfPresence(userId, payload.status)
	})

	socket.on("disconnect", async () => {
		const count = onlineUsers.get(userId) ?? 0
		if (count <= 1) {
			onlineUsers.delete(userId)
			activityStatus.delete(userId)

			const match = findActiveMatchOf(currentMatches, userId)
			if (match)
				startDisconnectTimer(match, userId, io)

			await notifyFriendsOfPresence(userId, "offline")
		} else
			onlineUsers.set(userId, count - 1)
	})

	if (before === 0) {
		const match = findActiveMatchOf(currentMatches, userId)
		if (match && match.players.find(p => p.userId === userId)?.leftAt !== 0)
			reconnectPlayer(match, userId, io)

		activityStatus.set(userId, "available")
		await notifyFriendsOfPresence(userId, "available")
	}
})

const PORT = 3000
server.listen(PORT, () => console.log(`Backend listening on port ${PORT}`))

export async function notifyFriendsOfPresence(userId: string, status: PresenceStatus) {
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
