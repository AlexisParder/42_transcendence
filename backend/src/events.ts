export interface ClientToServerEvents {
	send_message: (payload: { toUserId: string, message: string }) => void
	send_friend_request: (payload: { toUserId: string }) => void
}

export interface ServerToClientEvents {
	new_message: (payload: Message) => void
	friend_request_received: (payload: FriendRequest) => void
}

export interface SocketData {
	userId: string
}

export interface Message {
	id: string,
	fromUserId: string,
	toUserId: string,
	message: string,
	createdAt: string,
}

export interface Friend {
	id: string,
	username: string | null,
	image: string | null | undefined
}

export interface FriendRequest {
	id: string,
	fromUserId: string,
	username: string | null | undefined,
	image: string | null | undefined
}