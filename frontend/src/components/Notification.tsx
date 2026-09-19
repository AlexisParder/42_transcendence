import { useEffect, useState } from "react"
import { FaCheck, FaXmark } from "react-icons/fa6"
import { useSocket } from "./socketContext"
import type { FriendRequest } from "../../../backend/src/events"

const messageNotification = {
	title: "Test notification",
	message: "The notification system is working.",
	date: "Just now"
}

export function Notification() {
	const socket = useSocket()
	const [showMessage, setShowMessage] = useState(true)
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])

	useEffect(() => {
		const timer = setTimeout(() => setShowMessage(false), 5000)

		return () => clearTimeout(timer)
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
	return (
		<div className="fixed bottom-20 right-4 z-50 w-80 space-y-2">
			{showMessage && <div className="rounded-box border border-neutral bg-base-100/95 p-3 shadow-lg backdrop-blur-sm">
				<p className="font-bold text-info">{messageNotification.title}</p>
				<p className="text-sm">{messageNotification.message}</p>
				<p className="text-xs text-base-content/60">{messageNotification.date}</p>
			</div>}

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
