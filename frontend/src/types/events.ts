export interface ClientToServerEvents {
	send_message: (payload: { toUserId: string, message: string }) => void
	set_active_conversation: (peerId: string | null) => void
	send_friend_request: (payload: { toUserId: string }) => void
	set_activity: (payload: { status: PresenceStatus }) => void
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
	refresh_chat_match: (payload: Matchs | undefined) => void
	start_match: () => void
	typing: (payload: { fromUserId: string, typing: boolean }) => void
	turn_update: (payload: {remaining: number}) => void
}

export type NotificationParams = Record<string, string | number>

export interface NotificationEvent {
	id: string
	title: string
	description: string
	params?: NotificationParams
	time: number
	requestId?: string
}

export type PresenceStatus = "available" | "in a match" | "away" | "offline"

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
	isDeleted: boolean
	lastMessage: string
	lastAt: string
	isMine: boolean
	unreadCount: number
}

export type matchType = "ONE_V_ONE" | "TWO_V_TWO" | "FFA" | "BOT"

export interface Match {
	id: string,
	result: 'win' | 'loss',
	otherPlayer: string | null,
	otherDeleted: boolean,
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
}

export interface Rank {
	id: string,
	en_label: string,
	fr_label: string,
	es_label: string,
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
	step: "deploy" | "game",
	visibility: "public" | "private",
	isRanked: boolean,
	startedAt: number,
	endedAt: number,
	hostId: string,
	players: MatchPlayers[],
	maxPlayers: number,
	invitedPlayers: string[],
	teams: Teams[],
	turns: Turns,
	logs: Log[],
	spectators: string[],
}

export interface Turns {
	userTurn: string | null,
	turnOrder: string[]
}

export interface Teams {
	id: number,
	ships: Ship[],
	shots: Shot[],
	chat: MatchMsg[]
}

export interface MatchMsg {
	authorId: string | null | undefined,
	message: string,
}

export type ShipName = "carrier" | "cruiser" | "destroyer" | "frigate" | "submarine"
export type vect2 = {x: number, y: number}

export interface Ship {
	name: ShipName,
	start: vect2,
	end: vect2,
	size: number,
	image?: string
}

export interface Shot {
	coords: vect2,
	status: "miss" | "hit" | "sunk"
	ship: null | Ship,
	authorId: string | null
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
	matchPoints: number,
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
	timestamp: number,
	authorId: string | null | undefined,
	authorUsername: string | null | undefined,
	targetId: string | null | undefined,
	targetUsername: string | null | undefined,
	logType: "fire" | "left",
	shot: Shot | null
}