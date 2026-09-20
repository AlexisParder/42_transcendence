import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { useDocumentTitle } from "../hooks/useDocumentTitle"

type NotificationItem = {
	id: string
	type: string
	message: string
	read: boolean
	createdAt: string
}

export function Notifications() {
	useDocumentTitle("Notifications")
	const [notifications, setNotifications] = useState<NotificationItem[]>([])

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

	async function markAsRead(notificationId: string) {
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
	}

	return (
		<Sidebar>
			<div className="p-4">
				<h1 className="text-xl font-bold text-info">Notifications</h1>
				<p className="mt-1 text-sm text-neutral-content/60">Your notification history</p>

				<div className="mt-6 space-y-3">
					{notifications.length === 0 && (
						<div className="rounded-box border border-neutral bg-base-100 p-4 text-sm text-neutral-content/60">
							No notifications yet.
						</div>
					)}

					{notifications.map(notification => (
						<button
							type="button"
							key={notification.id}
							onClick={() => {
								if (!notification.read)
									markAsRead(notification.id)
							}}
							className={`w-full rounded-box border border-neutral bg-base-100 p-4 text-left ${notification.read ? "opacity-60" : "bg-info/10"}`}
						>
							<div className="flex items-center justify-between gap-3">
								<p className="font-bold text-info">
									{notification.type === "FRIEND_REQUEST" ? "Friend request" : "Notification"}
								</p>
								{!notification.read && <span className="badge badge-warning badge-sm">Unread</span>}
							</div>
							<p className="mt-2 text-sm">{notification.message}</p>
							<p className="mt-2 text-xs text-base-content/60">
								{new Date(notification.createdAt).toLocaleString()}
							</p>
						</button>
					))}
				</div>
			</div>
		</Sidebar>
	)
}
