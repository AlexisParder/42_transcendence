import { useEffect, useState } from "react"
import type React from "react"
import { FaCheck, FaXmark } from "react-icons/fa6"
import { RxCross1 } from "react-icons/rx"
import { useSocket } from "./socketContext"
import { authClient } from "../lib/auth-client"
import type { NotificationEvent } from "../types/events"
import { t } from "../lib/translate"
import { onNotification } from "../lib/notify"
import { apiPost } from "../lib/api"

type LiveNotification = NotificationEvent & { leaving?: boolean }

export function Notification() {
	const { data: session } = authClient.useSession()
	return session ? <LiveNotifications key={session.user.id} /> : null
}

function LiveNotifications() {
	const socket = useSocket()
	const [friendRequests, setFriendRequests] = useState<LiveNotification[]>([])
	const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([])

	useEffect(() => {
		const timers = new Set<ReturnType<typeof setTimeout>>()

		function showNotification(notification: NotificationEvent) {
			if (notification.requestId && window.location.pathname === "/friends" && !document.hidden)
				return

			const setter = notification.requestId ? setFriendRequests : setLiveNotifications
			setter(prev => [...prev.filter(item => item.id !== notification.id), notification].slice(-3))

			if (notification.time <= 0)
				return

			const timer = setTimeout(() => {
				setter(prev => prev.map(item => item.id === notification.id ? { ...item, leaving: true } : item))
				timers.delete(timer)
			}, notification.time)

			timers.add(timer)
		}

		function onFriendRequestResolved({ requestId }: { requestId: string, accepted: boolean }) {
			setFriendRequests(prev => prev.map(request => request.requestId === requestId ? { ...request, leaving: true } : request))
		}

		socket.on("notification_received", showNotification)
		socket.on("friend_request_resolved", onFriendRequestResolved)
		const offLocalNotification = onNotification(showNotification)

		return () => {
			socket.off("notification_received", showNotification)
			socket.off("friend_request_resolved", onFriendRequestResolved)
			offLocalNotification()
			for (const timer of timers)
				clearTimeout(timer)
		}
	}, [socket])

	async function answerFriendRequest(requestId: string, action: "accept" | "decline") {
		const endpoint = action === "accept"
			? "/api/accept-friend-request"
			: "/api/decline-friend-request"
		const {ok} = await apiPost(endpoint, { requestId })

		if (ok)
			setFriendRequests(prev => prev.map(request => request.requestId === requestId ? { ...request, leaving: true } : request))
	}

	function closeNotification(notificationId: string) {
		setFriendRequests(prev => prev.map(notification => notification.id === notificationId ? { ...notification, leaving: true } : notification))
		setLiveNotifications(prev => prev.map(notification => notification.id === notificationId ? { ...notification, leaving: true } : notification))
	}

	function removeNotification(notificationId: string) {
		setFriendRequests(prev => prev.filter(notification => notification.id !== notificationId))
		setLiveNotifications(prev => prev.filter(notification => notification.id !== notificationId))
	}

	const visibleFriendRequests = friendRequests.slice(-3)
	const remainingSlots = 3 - visibleFriendRequests.length
	const visibleNotifications = remainingSlots > 0 ? liveNotifications.slice(-remainingSlots) : []

	return (
		<div className="fixed bottom-20 right-4 z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col">
			{visibleNotifications.map(notification => (
				<NotificationCard
					key={notification.id}
					notification={notification}
					onClose={() => closeNotification(notification.id)}
					onRemove={() => removeNotification(notification.id)}
				/>
			))}

			{visibleFriendRequests.map(request => (
				<NotificationCard
					key={request.id}
					notification={request}
					onClose={() => closeNotification(request.id)}
					onRemove={() => removeNotification(request.id)}
				>
					<div className="flex items-center justify-between gap-2 border-t border-base-300 px-3 py-2">
						<p className="text-xs text-neutral-content/60 first-letter:uppercase">{t("notifications_add_player")}</p>
						<div className="flex gap-1">
							<button
								className="btn btn-xs bg-info/10 border border-info/50"
								disabled={!request.requestId}
								onClick={() => request.requestId && answerFriendRequest(request.requestId, "accept")}
								aria-label={t("notifications_accept_friend_request")}
							>
								<FaCheck className="text-info" />
							</button>
							<button
								className="btn btn-xs bg-error/10 border border-error/50"
								disabled={!request.requestId}
								onClick={() => request.requestId && answerFriendRequest(request.requestId, "decline")}
								aria-label={t("notifications_decline_friend_request")}
							>
								<RxCross1 className="text-error" />
							</button>
						</div>
					</div>
				</NotificationCard>
			))}
		</div>
	)
}

function NotificationCard({ notification, onClose, onRemove, children }: {
	notification: LiveNotification,
	onClose: () => void,
	onRemove: () => void,
	children?: React.ReactNode
}) {
	return <div
		className={`grid ${notification.leaving ? "animate-notification-out" : "animate-notification-in"}`}
		onAnimationEnd={event => {
			if (notification.leaving && event.target === event.currentTarget)
				onRemove()
		}}
	>
		<div className={`min-h-0 ${notification.leaving ? "overflow-hidden" : ""}`}>
			<div className="pt-2">
				<div className="relative overflow-hidden rounded-md border border-neutral bg-base-200 shadow-xl">
					<div className="flex items-start gap-2 p-3">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<p className="truncate font-mono text-xs font-medium uppercase tracking-brand text-info">{t(notification.title, notification.params)}</p>
							</div>
							<p className="mt-1 line-clamp-3 wrap-break-word text-sm">{t(notification.description, notification.params)}</p>
						</div>
						<button
							className="btn btn-ghost btn-xs btn-square text-neutral-content/50 hover:text-neutral-content"
							onClick={onClose}
							aria-label={t("notifications_close")}
						>
							<FaXmark />
						</button>
					</div>
					{children}
					{notification.time > 0 && (
						<div
							className="absolute bottom-0 left-0 h-0.5 bg-info/50 animate-notification-timer"
							style={{ animationDuration: `${notification.time}ms` }}
						/>
					)}
				</div>
			</div>
		</div>
	</div>
}
