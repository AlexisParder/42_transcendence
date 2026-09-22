import { useEffect, useState } from "react"
import { FaTrash } from "react-icons/fa6"
import { Sidebar } from "../components/Sidebar"
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { Modal, ShowModal, HideModal } from "../components/Modal"

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

	async function markAllAsRead() {
		const response = await fetch("/api/notifications/read-all", {
			method: "POST",
			credentials: "include"
		})

		if (response.ok)
			setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
	}

	async function deleteNotification(notificationId: string) {
		const response = await fetch("/api/notifications/delete", {
			method: "POST",
			headers: { "Content-type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ notificationId })
		})

		if (response.ok)
			setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
	}

	async function deleteAllNotifications() {
		const response = await fetch("/api/notifications/delete-all", {
			method: "POST",
			credentials: "include"
		})

		if (response.ok)
			setNotifications([])

		HideModal("DeleteAllNotificationsModal")
	}

	return (
		<Sidebar>
			<div className="p-4">
				<h1 className="text-xl font-bold text-info">Notifications</h1>
				<p className="mt-1 text-sm text-neutral-content/60">Your notification history</p>
				<button
					type="button"
					className="btn btn-info btn-sm mt-4"
					onClick={markAllAsRead}
				>
					Mark all as read
				</button>
				<button
					type="button"
					className="btn btn-error btn-sm ml-2 mt-4"
					onClick={() => ShowModal("DeleteAllNotificationsModal")}
				>
					Delete all
				</button>

				<div className="mt-6 space-y-3">
					{notifications.length === 0 && (
						<div className="rounded-box border border-neutral bg-base-100 p-4 text-sm text-neutral-content/60">
							No notifications yet.
						</div>
					)}

					{notifications.map(notification => (
						<div
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
								<div className="flex items-center gap-2">
									{!notification.read && <span className="badge badge-warning badge-sm">Unread</span>}
									<button
										type="button"
										className="btn btn-error btn-ghost btn-sm btn-circle"
										onClick={event => {
											event.stopPropagation()
											deleteNotification(notification.id)
										}}
										aria-label="Delete notification"
									>
										<FaTrash />
									</button>
								</div>
							</div>
							<p className="mt-2 text-sm">{notification.message}</p>
							<p className="mt-2 text-xs text-base-content/60">
								{new Date(notification.createdAt).toLocaleString()}
							</p>
						</div>
					))}
				</div>
			</div>

			<Modal id="DeleteAllNotificationsModal">
				<h3 className="text-lg font-bold">Delete all notifications?</h3>
				<p className="py-4 text-sm text-neutral-content/60">
					This action cannot be undone.
				</p>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						className="btn btn-neutral"
						onClick={() => HideModal("DeleteAllNotificationsModal")}
					>
						Cancel
					</button>
					<button
						type="button"
						className="btn btn-error"
						onClick={deleteAllNotifications}
					>
						Delete all
					</button>
				</div>
			</Modal>
		</Sidebar>
	)
}
