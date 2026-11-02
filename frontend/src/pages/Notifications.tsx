import { useEffect, useState } from "react"
import { FaTrash } from "react-icons/fa6"
import { Sidebar } from "../components/Sidebar"
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { Modal, ShowModal, HideModal } from "../components/Modal"
import { getTranslationLanguage, t } from "../lib/translate"
import { apiPost, apiGet } from "../lib/api"
import type { NotificationParams } from "../types/events"

type NotificationItem = {
	id: string
	title: string
	description: string
	params?: NotificationParams
	read: boolean
	createdAt: string
}

export function Notifications() {
	const dateLocale = getTranslationLanguage()
	useDocumentTitle(t("notifications_title"))
	const [notifications, setNotifications] = useState<NotificationItem[]>([])

	useEffect(() => {
		async function loadNotifications() {
			try {
				const { ok, data } = await apiGet("/api/notifications")
				if (!ok)
					return

				setNotifications(data.notifications ?? [])
			} catch (error) {
				console.error("load notifications:", error)
			}
		}

		loadNotifications()
	}, [])

	async function markAsRead(notificationId: string) {
		try {
			const { ok } = await apiPost("/api/notifications/read", { notificationId })

			if (ok)
				setNotifications(prev => prev.map(notification =>
					notification.id === notificationId
						? { ...notification, read: true }
						: notification
				))
		} catch (error) {
			console.error("mark as read:", error)
		}
	}

	async function markAllAsRead() {
		try {
			const { ok } = await apiPost("/api/notifications/read-all")

			if (ok)
				setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
		} catch (error) {
			console.error("mark all as read:", error)
		}
	}

	async function deleteNotification(notificationId: string) {
		try {
			const { ok } = await apiPost("/api/notifications/delete", { notificationId })

			if (ok)
				setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
		} catch (error) {
			console.error("delete notification:", error)
		}
	}

	async function deleteAllNotifications() {
		try {
			const { ok } = await apiPost("/api/notifications/delete-all")

			if (ok)
				setNotifications([])
		} catch (error) {
			console.error("delete all notifications:", error)
		}

		HideModal("DeleteAllNotificationsModal")
	}

	return (
		<Sidebar>
			<div className="p-4">
				<h1 className="text-xl font-bold text-white">{t("notifications_title")}</h1>
				<p className="mt-1 text-sm text-neutral-content/60">{t("notifications_history")}</p>

				<div className="flex mt-4 gap-2">
					<button className="btn btn-soft btn-info border-info/50 hover:border-info" onClick={markAllAsRead}>{t("notifications_mark_all_read")}</button>
					<button className="btn btn-soft btn-error border-error/50 hover:border-error" onClick={() => ShowModal("DeleteAllNotificationsModal")}>{t("notifications_delete_all")}</button>
				</div>

				<div className="mt-6 space-y-3">
					{notifications.length === 0 && (
						<div className="rounded-md border border-neutral/50 bg-neutral/10 p-4 text-sm text-neutral-content/50">
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
							className={`w-full rounded-md border p-4 text-left ${notification.read
								? "bg-neutral/10 border-neutral/50"
								: "cursor-pointer bg-info/10 border-info/50"}`}
						>
							<div className="flex items-center justify-between gap-3">
								<p className={`text-sm font-bold ${notification.read ? "text-neutral-content/60" : "text-info"}`}>
									{t(notification.title, notification.params)}
								</p>
								<div className="flex shrink-0 items-center gap-2">
									{!notification.read && (
										<span className="uppercase bg-info/10 border border-info/50 rounded-xl py-0.5 px-2 text-xs text-info">
											{t("notifications_unread")}
										</span>
									)}
									<button
										type="button"
										className="btn btn-xs bg-error/10 border border-error/50 text-error"
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
							<p className="mt-2 text-sm text-neutral-content/80">{t(notification.description, notification.params)}</p>
							<p className="mt-2 text-xs text-neutral-content/50">
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
