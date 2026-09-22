import { useEffect, useState } from "react"
import { FaCheck, FaXmark } from "react-icons/fa6"
import { useSocket } from "./socketContext"
import { authClient } from "../lib/auth-client"
import type { FriendRequest, Message } from "../../../backend/src/events"

export function Notification() {
	const socket = useSocket()
	const { data: session } = authClient.useSession()
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
	const [liveMessages, setLiveMessages] = useState<Message[]>([])

	useEffect(() => {
		function onFriendRequest(request: FriendRequest) {
			setFriendRequests(prev => [...prev, request])
			setTimeout(() => {
				setFriendRequests(prev => prev.filter(item => item.id !== request.id))
			}, 5000)
		}
		socket.on("friend_request_received", onFriendRequest)
		return () => {
			socket.off("friend_request_received", onFriendRequest)
		}
	}, [socket])

	useEffect(() => {
		function onNewMessage(message: Message) {
			if (message.toUserId !== session?.user.id)
				return

			setLiveMessages(prev => [...prev, message])
			setTimeout(() => {
				setLiveMessages(prev => prev.filter(item => item.id !== message.id))
			}, 5000)
		}

		socket.on("new_message", onNewMessage)

		return () => {
			socket.off("new_message", onNewMessage)
		}
	}, [socket, session?.user.id])

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
	const visibleFriendRequests = friendRequests.slice(-3)
	const remainingSlots = 3 - visibleFriendRequests.length
	const visibleMessages = liveMessages.slice(-remainingSlots)

	return (
		<div className="fixed bottom-20 right-4 z-50 w-50 space-y-2">
			{visibleMessages.map(message => (
				<div key={message.id} className="rounded-box border border-info bg-base-100/95 p-3 shadow-lg backdrop-blur-sm">
					<p className="font-bold text-info">New message</p>
					<p className="text-sm">{message.message}</p>
					<p className="text-xs text-base-content/60">Just now</p>
				</div>
			))}

			{visibleFriendRequests.map(request => (
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
