export interface ClientToServerEvents {
	send_message: (payload: { toUserId: string, message: string }) => void
	send_friend_request: (payload: { toUserId: string }) => void
	set_activity: (payload: { status: "available" | "away" }) => void
}

export interface ServerToClientEvents {
	new_message: (payload: Message) => void
	friend_request_received: (payload: FriendRequest) => void
	friend_request_accepted: (payload: FriendRequestAccept) => void
	presence_update: (payload: PresenceUpdate) => void
	friend_removed: (payload: { userId: string }) => void
}

export type PresenceStatus = "available" | "offline" | "away"

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
	username: string | null | undefined,
	image: string | null | undefined,
	status: PresenceStatus
}

export interface FriendRequest {
	id: string,
	fromUserId: string,
	username: string | null | undefined,
	image: string | null | undefined
}

export interface FriendRequestAccept {
	friendId: string,
	username: string | null | undefined,
	image: string | null | undefined
}

export interface PresenceUpdate {
	userId: string,
	status: PresenceStatus
}

export interface ConversationSummary {
	peerId: string
	username: string | null | undefined
	image: string | null | undefined
	lastMessage: string
	lastAt: string
	isMine: boolean
	unreadCount: number
}

export interface Match {
	id: string,
	result: 'win' | 'loss',
	desc: string,
	matchType: "ONE_V_ONE" | "TWO_V_TWO" | "THREE_FFA" | "FOUR_FFA",
	matchTime: string,
	ranked: boolean,
	points: number | 'unranked',
}

export interface Stat {
	total: number,
	winRate: number,
	shotAccuracy: number,
	tournamentsWon: number,
}

export interface Rank {
	id: string,
	en_label: string,
	fr_label: string,
	min: number
}

export interface UserInfo {
	points: number,
	username: string | null | undefined,
	image: string | null | undefined,
	createdAt: string,
	leaderboardPos: string,
	isMine: boolean
}

export interface LeaderboardInfo {
	id: string,
	points: number,
	username: string | null | undefined,
	image: string | null | undefined,
	isMine: boolean,
	pos: number,
	matches: number,
	win: number,
	lose: number,
	accuracy: number
}