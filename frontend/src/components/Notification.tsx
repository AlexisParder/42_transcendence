import { useEffect, useState } from "react"
import { FaCheck, FaXmark } from "react-icons/fa6"
import { useSocket } from "./socketContext"
import { authClient } from "../lib/auth-client"
import type { NotificationEvent } from "../types/events"
import { t } from "../lib/translate"
import { notificationMessage } from "../lib/notificationMessage"

export function Notification() {
	const { data: session } = authClient.useSession()
	return session ? <LiveNotifications key={session.user.id} /> : null
}

function LiveNotifications() {
	const socket = useSocket()
	const [friendRequests, setFriendRequests] = useState<NotificationEvent[]>([])
	const [liveMessages, setLiveMessages] = useState<NotificationEvent[]>([])

	useEffect(() => {
		const timers = new Set<ReturnType<typeof setTimeout>>()
		function onNotification(notification: NotificationEvent) {
			if (notification.type === "FRIEND_REQUEST" && window.location.pathname === "/friends" && !document.hidden)
				return

			const setter = notification.type === "FRIEND_REQUEST" ? setFriendRequests : setLiveMessages
			setter(prev => [...prev.filter(item => item.id !== notification.id), notification].slice(-3))
			const timer = setTimeout(() => {
				setter(prev => prev.filter(item => item.id !== notification.id))
				timers.delete(timer)
			}, 5000)
			timers.add(timer)
		}
		socket.on("notification_received", onNotification)
		return () => {
			socket.off("notification_received", onNotification)
			for (const timer of timers) clearTimeout(timer)
		}
	}, [socket])

	async function answerFriendRequest(requestId: string, action: "accept" | "decline") {
		const endpoint = action === "accept"
			? "/api/accept-friend-request"
			: "/api/decline-friend-request"

		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ requestId })
		})

		if (response.ok)
			setFriendRequests(prev => prev.filter(request => request.requestId !== requestId))
	}
	const visibleFriendRequests = friendRequests.slice(-3)
	const remainingSlots = 3 - visibleFriendRequests.length
	const visibleMessages = remainingSlots > 0 ? liveMessages.slice(-remainingSlots) : []

	return (
		<div className="fixed bottom-20 right-4 z-50 w-50 space-y-2">
			{visibleMessages.map(message => (
				<div key={message.id} className="rounded-box border border-info bg-base-100/95 p-3 shadow-lg backdrop-blur-sm">
					<p className="font-bold text-info">{t("notifications_new_message")}</p>
					<p className="text-sm">{notificationMessage(message.message)}</p>
					<p className="text-xs text-base-content/60">{t("notifications_just_now")}</p>
				</div>
			))}

			{visibleFriendRequests.map(request => (
				<div key={request.id} className="rounded-box border border-neutral bg-base-100/95 p-3 shadow-lg backdrop-blur-sm">
					<p className="font-bold text-info">{t("notifications_friend_request")}</p>
					<p className="text-sm">{notificationMessage(request.message)}</p>
					<p className="mt-2 text-sm">{t("notifications_add_player")}</p>
					<div className="mt-2 flex justify-end gap-2">
						<button
							className="btn btn-error btn-sm btn-circle"
							disabled={!request.requestId}
							onClick={() => request.requestId && answerFriendRequest(request.requestId, "decline")}
							aria-label={t("notifications_decline_friend_request")}
						>
							<FaXmark />
						</button>
						<button
							className="btn btn-success btn-sm btn-circle"
							disabled={!request.requestId}
							onClick={() => request.requestId && answerFriendRequest(request.requestId, "accept")}
							aria-label={t("notifications_accept_friend_request")}
						>
							<FaCheck />
						</button>
					</div>
				</div>
			))}
		</div>
	)
}
