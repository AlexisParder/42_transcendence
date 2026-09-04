export interface ClienToServerEvents {
	send_message: (payload: { toUserId: string, message: string }) => void
	send_friend_request: (payload: { toUserId: string }) => void
}

export interface ServerToClientEvents {
	new_message: (payload: Message ) => void
	friend_request_received: (payload: { fromUserId: string }) => void
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