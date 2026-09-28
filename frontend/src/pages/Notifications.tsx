import { useEffect, useState } from "react"
import { FaTrash } from "react-icons/fa6"
import { Sidebar } from "../components/Sidebar"
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { Modal, ShowModal, HideModal } from "../components/Modal"
import { authClient } from "../lib/auth-client"
import { t } from "../lib/translate"
import { notificationMessage } from "../lib/notificationMessage"

type NotificationItem = {
	id: string
	type: string
	message: string
	read: boolean
	createdAt: string
}

export function Notifications() {
	const { data: session } = authClient.useSession()
	const dateLocale = session?.user.language === "fr" ? "fr-FR"
		: session?.user.language === "en" ? "en-US" : navigator.language
	useDocumentTitle(t("notifications_title"))
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
				<h1 className="text-xl font-bold text-info">{t("notifications_title")}</h1>
				<p className="mt-1 text-sm text-neutral-content/60">{t("notifications_history")}</p>
				<button
					type="button"
					className="btn btn-info btn-sm mt-4"
					onClick={markAllAsRead}
				>
					{t("notifications_mark_all_read")}
				</button>
				<button
					type="button"
					className="btn btn-error btn-sm ml-2 mt-4"
					onClick={() => ShowModal("DeleteAllNotificationsModal")}
				>
					{t("notifications_delete_all")}
				</button>

				<div className="mt-6 space-y-3">
					{notifications.length === 0 && (
						<div className="rounded-box border border-neutral bg-base-100 p-4 text-sm text-neutral-content/60">
							{t("notifications_empty")}
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
									{notification.type === "FRIEND_REQUEST" ? t("notifications_friend_request") : t("notifications_item")}
								</p>
								<div className="flex items-center gap-2">
									{!notification.read && <span className="badge badge-warning badge-sm">{t("notifications_unread")}</span>}
									<button
										type="button"
										className="btn btn-error btn-ghost btn-sm btn-circle"
										onClick={event => {
											event.stopPropagation()
											deleteNotification(notification.id)
										}}
										aria-label={t("notifications_delete_one")}
									>
										<FaTrash />
									</button>
								</div>
							</div>
							<p className="mt-2 text-sm">{notificationMessage(notification.message)}</p>
							<p className="mt-2 text-xs text-base-content/60">
								{new Date(notification.createdAt).toLocaleString(dateLocale)}
							</p>
						</div>
					))}
				</div>
			</div>

			<Modal id="DeleteAllNotificationsModal">
				<h3 className="text-lg font-bold">{t("notifications_delete_confirm_title")}</h3>
				<p className="py-4 text-sm text-neutral-content/60">
					{t("notifications_delete_confirm_desc")}
				</p>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						className="btn btn-neutral"
						onClick={() => HideModal("DeleteAllNotificationsModal")}
					>
						{t("btn_cancel")}
					</button>
					<button
						type="button"
						className="btn btn-error"
						onClick={deleteAllNotifications}
					>
						{t("notifications_delete_all")}
					</button>
				</div>
			</Modal>
		</Sidebar>
	)
}
