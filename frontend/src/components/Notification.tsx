import { useEffect, useState } from "react"
import { FaCheck, FaXmark } from "react-icons/fa6"
import { useSocket } from "./socketContext"
import type { FriendRequest } from "../../../backend/src/events"

type StoredNotification = {
	id: string
	type: string
	message: string
	read: boolean
	createdAt: string
}

export function Notification() {
	const socket = useSocket()
	const [notifications, setNotifications] = useState<StoredNotification[]>([])
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])

	useEffect(() => {
		async function loadNotifications() {
			try {
				const response = await fetch("/api/notifications", {
					credentials: "include"
				})

				if (!response.ok)
					return

				const data = await response.json()
				setNotifications(data.notifications ?? [])
			} catch (error) {
				console.error("load notifications:", error)
			}
		}

		loadNotifications()
	}, [])

	useEffect(() => {
		function onFriendRequest(request: FriendRequest) {
			setFriendRequests(prev => [...prev, request])
		}
		socket.on("friend_request_received", onFriendRequest)
		return () => {
			socket.off("friend_request_received", onFriendRequest)
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
			setFriendRequests(prev => prev.filter(request => request.id !== requestId))
	}

	async function markNotificationRead(notificationId: string) {
		try {
			const response = await fetch("/api/notifications/read", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ notificationId })
			})

			if (response.ok)
				setNotifications(prev => prev.map(notification =>
					notification.id === notificationId
						? { ...notification, read: true }
						: notification
				))
		} catch (error) {
			console.error("mark notification read:", error)
		}
	}

	return (
		<div className="fixed bottom-20 right-4 z-50 w-80 space-y-2">
			{notifications.map(notification => (
				<button
					type="button"
					key={notification.id}
					className={`w-full rounded-box border border-neutral bg-base-100/95 p-3 text-left shadow-lg backdrop-blur-sm ${notification.read ? "opacity-60" : "cursor-pointer"}`}
					onClick={() => {
						if (!notification.read)
							markNotificationRead(notification.id)
					}}
				>
					<p className="font-bold text-info">
						{notification.type === "FRIEND_REQUEST" ? "Friend request" : "Notification"}
					</p>
					<p className="text-sm">{notification.message}</p>
					<p className="text-xs text-base-content/60">
						{new Date(notification.createdAt).toLocaleString()}
					</p>
				</button>
			))}

			{friendRequests.map(request => (
				<div key={request.id} className="rounded-box border border-neutral bg-base-100/95 p-3 shadow-lg backdrop-blur-sm">
					<p className="font-bold text-info">Friend request</p>
					<p className="text-sm">{request.username ?? "A player"} wants to be your friend.</p>
					<p className="mt-2 text-sm">Do you want to add this player?</p>
					<div className="mt-2 flex justify-end gap-2">
						<button
							className="btn btn-error btn-sm btn-circle"
							onClick={() => answerFriendRequest(request.id, "decline")}
							aria-label="Decline friend request"
						>
							<FaXmark />
						</button>
						<button
							className="btn btn-success btn-sm btn-circle"
							onClick={() => answerFriendRequest(request.id, "accept")}
							aria-label="Accept friend request"
						>
							<FaCheck />
						</button>
					</div>
				</div>
			))}
		</div>
	)
}
