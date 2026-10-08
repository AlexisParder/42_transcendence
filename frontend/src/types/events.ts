export interface ClientToServerEvents {
	send_message: (payload: { toUserId: string, message: string }) => void
	set_active_conversation: (peerId: string | null) => void
	send_friend_request: (payload: { toUserId: string }) => void
	set_activity: (payload: { status: "available" | "away" }) => void
	set_typing: (payload: { toUserId: string, typing: boolean }) => void
}

export interface ServerToClientEvents {
	notification_received: (payload: NotificationEvent) => void
	new_message: (payload: Message) => void
	messages_read: (payload: { by: string }) => void
	friend_request_received: (payload: FriendRequest) => void
	friend_request_accepted: (payload: FriendRequestAccept) => void
	friend_request_resolved: (payload: { requestId: string, accepted: boolean }) => void
	presence_update: (payload: PresenceUpdate) => void
	friend_removed: (payload: { userId: string }) => void
	refresh_joined_match: (payload: Matchs | undefined) => void
	typing: (payload: { fromUserId: string, typing: boolean }) => void
}

export interface NotificationEvent {
	id: string
	type: string
	message: string
	read: boolean
	createdAt: string
	requestId?: string
}

export type PresenceStatus = "available" | "offline" | "away"

export interface SocketData {
	userId: string
	activeConversationPeerId?: string | null
}

export interface Message {
	id: string,
	fromUserId: string,
	toUserId: string,
	message: string,
	createdAt: string,
	isRead: boolean
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

export type matchType = "ONE_V_ONE" | "TWO_V_TWO" | "THREE_FFA" | "FOUR_FFA" | "BOT"

export interface Match {
	id: string,
	result: 'win' | 'loss',
	otherPlayer: string | null,
	placement: number | null,
	matchType: matchType,
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
	leaderboardPos: number,
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

export interface Rules {
	format: string,
	timeTurn: number,
	replace: boolean,
	spectators: boolean,
	ranked: boolean
}

export interface Matchs {
	type: matchType,
	settings: MatchSettings,
	code: string,
	visibility: "public" | "private",
	isRanked: boolean,
	startedAt: string,
	endedAt: string,
	hostId: string | null,
	players: MatchPlayers[],
	maxPlayers: number,
	invitedPlayers: string[],
	teams: Teams[]
}

export interface Teams {
	idTeam: number,
	ships: Ship[],
	shots: Shot[],
}

export type ShipName = "carrier" | "cruiser" | "destroyer" | "frigate" | "submarine"
export type vect2 = {x: number, y: number}

export interface Ship {
	name: ShipName,
	start: vect2,
	end: vect2,
	size: number,
	image: string
}

export interface Shot {
	coords: vect2,
	status: "miss" | "hit" | "sunk"
	ship: null | Ship,
	authorId: string | null,
	authorTeam: number
}

export interface MatchPlayers {
	userId: string | null,
	username: string | null | undefined,
	image: string | null | undefined,
	isReady: boolean,
	isBot: boolean,
	team: number,
	placement: number,
	points: number,
	leftAt: string | null,
	status: "PLAYED" | "LEFT"
	shotsHit: number,
	shotsTotal: number
}

export interface MatchSettings {
	time_turn: number,
	replace: boolean,
	spectators: boolean
}

export interface Log {
	text: string,
	type: "info" | "warning" | "neutral"
}