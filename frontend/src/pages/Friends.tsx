import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Input, InputWithText } from "../components/Input";
import { Sidebar } from "../components/Sidebar";
import { FaCheck, FaPlus } from "react-icons/fa6";
import { RxCross1 } from "react-icons/rx";
import { useSocket } from "../components/socketContext";
import type { ConversationSummary, Friend, FriendRequest, FriendRequestAccept, Message, PresenceStatus, PresenceUpdate } from "../../../backend/src/events";
import { authClient } from "../lib/auth-client";
import { HideModal, Modal, ShowModal } from "../components/Modal";
import { t } from "../lib/translate";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatTime } from "../lib/formatTime";
import { truncateText } from "../lib/truncateText";

export function Friends() {
	useDocumentTitle(t("friends_title"))
	const socket = useSocket()
	const { data: session } = authClient.useSession()
	const [sendInput, setSendInput] = useState("")
	const [peerId, setPeerId] = useState<string | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [friends, setFriends] = useState<Friend[]>([])
	const scrollRef = useRef<HTMLDivElement>(null)
	const [errors, setErrors] = useState<{ username?: string, block?: string }>({})
	const [requests, setRequests] = useState<FriendRequest[]>([])
	const [presence, setPresence] = useState<Record<string, PresenceStatus>>({})
	const [conversations, setConversations] = useState<ConversationSummary[]>([])
	const conversationsRef = useRef<ConversationSummary[]>([])
	const [blocked, setBlocked] = useState<Friend[]>([])
	const [blockTarget, setBlockTarget] = useState<string | null>(null)

	const onlineFriends = friends.filter(f => (presence[f.id] ?? f.status) !== "offline")
	const offlineFriends = friends.filter(f => (presence[f.id] ?? f.status) === "offline")

	useEffect(() => {
		function onPresence(payload: PresenceUpdate) {
			setPresence(prev => ({ ...prev, [payload.userId]: payload.status }))
		}
		socket.on("presence_update", onPresence)

		return () => {
			socket.off("presence_update", onPresence)
		}
	}, [socket])

	useEffect(() => {
		async function loadFriends() {
			try {
				const res = await fetch("/api/get-friends", {
					method: "GET",
					headers: { "Content-type": "application/json" },
					credentials: "include"
				})

				if (!res.ok)
					return

				const data = await res.json()
				setFriends(data.friends ?? [])

				const initialPresence: Record<string, PresenceStatus> = {}
				for (const f of data.friends ?? [])
					initialPresence[f.id] = f.status
				setPresence(initialPresence)
			} catch (error) {
				console.error("load friends:", error)
			}
		}

		loadFriends()
	}, [])

	useEffect(() => {
		async function loadFriendsPending() {
			try {
				const res = await fetch("/api/get-friends-pending", {
					method: "GET",
					headers: { "Content-type": "application/json" },
					credentials: "include"
				})

				if (!res.ok)
					return

				const data = await res.json()
				setRequests(data.requests ?? [])
			} catch (error) {
				console.error("load friends pending:", error)
			}
		}

		loadFriendsPending()
	}, [])

	useEffect(() => {
		async function loadBlocked() {
			try {
				const res = await fetch("/api/get-blocked", {
					method: "POST",
					headers: { "Content-type": "application/json" },
					credentials: "include"
				})

				if (!res.ok)
					return

				const data = await res.json()
				setBlocked(data.blocked ?? [])
			} catch (error) {
				console.error("load blocked:", error)
			}
		}

		loadBlocked()
	}, [])

	useEffect(() => {
		conversationsRef.current = conversations
	}, [conversations])

	async function reloadConversations() {
		try {
			const res = await fetch("/api/get-conversations", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
			})

			if (!res.ok)
				return

			const data = await res.json()
			setConversations(data.conversations ?? [])
		} catch (error) {
			console.error("load conversations:", error)
		}
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		reloadConversations()
	}, [])

	async function setRead(peer: string | null | undefined) {
		if (!peer)
			return

		try {
			const res = await fetch("/api/set-read", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ peer }),
			})

			if (!res.ok)
				return

			setConversations(prev => prev.map(c => c.peerId === peer ? { ...c, unreadCount: 0 } : c))
		} catch (error) {
			console.error("setRead:", error)
		}
	}

	useEffect(() => {
		if (!peerId)
			return
		let cancelled = false

		async function loadHistory() {
			try {
				const res = await fetch("/api/get-conv-history", {
					method: "POST",
					headers: { "Content-type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ peerId }),
				})

				if (!res.ok)
					return

				const data = await res.json()

				if (cancelled)
					return
				setMessages(data.messages ?? [])
			} catch (error) {
				if (!cancelled)
					console.error("load history:", error)
			}
		}

		loadHistory()
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setRead(peerId)

		return () => {
			cancelled = true
		}
	}, [peerId])

	useLayoutEffect(() => {
		const el = scrollRef.current;
		if (el)
			el.scrollTop = el.scrollHeight
	}, [messages])

	useEffect(() => {
		function onFriendRequest(req: FriendRequest) {
			setRequests(prev => [...prev, req])
		}

		socket.on("friend_request_received", onFriendRequest)

		return () => {
			socket.off("friend_request_received", onFriendRequest)
		}
	}, [socket])

	useEffect(() => {
		function onAccepted(payload: FriendRequestAccept) {
			setFriends(prev => [...prev, {
				id: payload.friendId,
				username: payload.username,
				image: payload.image,
				status: "available"
			}])
		}

		socket.on("friend_request_accepted", onAccepted)
		return () => {
			socket.off("friend_request_accepted", onAccepted)
		}
	}, [socket])

	function updateConversationList(prev: ConversationSummary[], msg: Message, myId: string, openPeerId: string | null): ConversationSummary[] {
		const otherId = msg.fromUserId === myId ? msg.toUserId : msg.fromUserId
		const isMine = msg.fromUserId === myId
		const isReceived = msg.toUserId === myId
		const countsAsUnread = isReceived && otherId !== openPeerId
		const existing = prev.find(c => c.peerId === otherId)
		const others = prev.filter(c => c.peerId !== otherId)
		const updated: ConversationSummary = {
			peerId: otherId,
			username: existing?.username ?? null,
			image: existing?.image ?? null,
			lastMessage: msg.message,
			lastAt: msg.createdAt,
			isMine,
			unreadCount: (existing?.unreadCount ?? 0) + (countsAsUnread ? 1 : 0)
		}

		return [updated, ...others]
	}

	useEffect(() => {
		function onNewMessage(msg: Message) {
			const myId = session?.user.id
			const concernsThisChat = msg.fromUserId === peerId || msg.toUserId === peerId

			if (concernsThisChat)
				setMessages(prev => [...prev, msg])

			if (msg.toUserId === myId && msg.fromUserId === peerId)
				setRead(peerId)

			const otherId = msg.fromUserId === myId ? msg.toUserId : msg.fromUserId
			const isNew = !conversationsRef.current.some(c => c.peerId === otherId)

			if (isNew)
				reloadConversations()
			else
				setConversations(prev => updateConversationList(prev, msg, myId ?? "", peerId))
		}

		socket.on("new_message", onNewMessage)
		return () => {
			socket.off("new_message", onNewMessage)
		}
	}, [socket, peerId, session])

	function handleSend() {
		if (!peerId)
			return

		const message = sendInput.trim()
		if (!message)
			return

		socket.emit("send_message", { toUserId: peerId, message })
		setSendInput("")
	}

	const handleSendRequestFriend: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		const formElem = e.currentTarget

		const username = new FormData(formElem).get("username")?.toString().trim() ?? ''
		if (username.length === 0) {
			setErrors({ username: t("txt_err_user_empty") })
			return
		} else if (blocked.find(b => b.username === username)) {
			setErrors({ username: t("friend_block_err_blocked") })
			return
		}

		const res = await fetch("/api/send-friend-request", {
			method: "POST",
			headers: { "Content-type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ username }),
		})

		const body = await res.json()
		if (!res.ok) {
			setErrors({ username: t(body.error) })
			return
		}

		HideModal("SendFriendRequestModal")
		setErrors({})
		formElem.reset()
		// Ajouter une notif de success
	}

	async function handleAccept(requestId: string) {
		try {
			const res = await fetch("/api/accept-friend-request", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ requestId })
			})

			const body = await res.json()
			if (!res.ok) {
				setErrors({ username: t(body.error) })
				return
			}

			const accepted = requests.find(r => r.id === requestId)
			setRequests(prev => prev.filter(r => r.id !== requestId))

			if (accepted)
				setFriends(prev => [...prev, {
					id: accepted.fromUserId,
					username: accepted.username,
					image: accepted.image,
					status: "available"
				}])
		} catch (error) {
			console.error("accept:", error)
		}
	}

	async function handleDecline(requestId: string) {
		try {
			const res = await fetch("/api/decline-friend-request", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ requestId })
			})

			const body = await res.json()
			if (!res.ok) {
				setErrors({ username: t(body.error) })
				return
			}
			setRequests(prev => prev.filter(r => r.id !== requestId))
		} catch (error) {
			console.error("decline:", error)
		}
	}

	function closeCurrentConv() {
		setPeerId("")
		setMessages([])
	}

	async function handleBlock(targetId: string) {
		try {
			const res = await fetch("/api/block-user", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ targetId })
			})

			const body = await res.json()
			if (!res.ok) {
				setErrors({ block: t(body.error) })
				return
			}

			const person = friends.find(f => f.id === targetId)
			setFriends(prev => prev.filter(f => f.id !== targetId))

			if (peerId === targetId)
				closeCurrentConv()

			if (person)
				setBlocked(prev => [...prev, { ...person, status: "offline" }])
		} catch (error) {
			console.error("block:", error)
		}
	}

	async function handleUnblock(targetId: string) {
		try {
			const res = await fetch("/api/unblock-user", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ targetId })
			})

			const body = await res.json()
			if (!res.ok) {
				setErrors({ block: t(body.error) })
				return
			}
			setBlocked(prev => prev.filter(b => b.id !== targetId))
		} catch (error) {
			console.error("unblock:", error)
		}
	}

	useEffect(() => {
		function onFriendRemoved(payload: { userId: string }) {
			setFriends(prev => prev.filter(f => f.id !== payload.userId))
			if (peerId === payload.userId)
				closeCurrentConv()
		}

		socket.on("friend_removed", onFriendRemoved)
		return () => {
			socket.off("friend_removed", onFriendRemoved)
		}
	}, [socket, peerId])

	function askBlock(targetId: string) {
		setBlockTarget(targetId)
		ShowModal("BlockConfirmModal")
	}

	return <Sidebar>
		<div className="flex">
			<div className="flex flex-1 flex-col h-screen min-w-0">
				<ConversationFriendDisplay friends={friends} peerId={peerId} onBlock={askBlock} />
				<div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
					<div className="flex flex-col min-h-full">
						{messages.map((msg) => <DisplayMessage key={msg.id} message={msg.message} isMine={msg.fromUserId === session?.user.id} />)}
					</div>
				</div>
				{peerId && <div className="flex items-center justify-between p-2 bg-base-200 gap-4">
					<div className="w-full pl-2">
						<Input type="text" name="message" label="Message" value={sendInput} onChange={(e) => setSendInput(e.target.value)} onKeyDown={(e) => {
							if (e.key === "Enter")
								handleSend()
						}} />
					</div>
					<button className="btn btn-outline btn-info" onClick={handleSend}>Send</button>
				</div>}
			</div>

			<div className="flex flex-col bg-base-200 h-screen">
				<div className="p-2">
					<Input type="text" name="search" label="Search friends..." />
				</div>
				<div className="flex-1 md:min-w-65 lg:min-w-75 overflow-y-auto">
					<div className="min-h-full">
						{conversations.length > 0 && <ConversationsSection conversations={conversations} onSelect={setPeerId} peerId={peerId} closeConv={closeCurrentConv} />}
						{requests.length> 0 && <RequestsSection requests={requests} onAccept={handleAccept} onDecline={handleDecline} />}
						{onlineFriends.length > 0 &&  <OnlineSection friends={onlineFriends} presence={presence} onSelect={setPeerId} peerId={peerId} closeConv={closeCurrentConv} />}
						{offlineFriends.length > 0 && <OfflineSection friends={offlineFriends} onSelect={setPeerId} peerId={peerId} closeConv={closeCurrentConv} />}
						{blocked.length > 0 && <BlockSection blocked={blocked} onUnblock={handleUnblock} />}
					</div>
				</div>
				<div className="p-4">
					<button className="btn btn-outline border-neutral w-full" onClick={() => {
						setErrors({})
						ShowModal('SendFriendRequestModal')
					}}><FaPlus /> {t("btn_add_friend")}</button>
				</div>
			</div>
		</div>

		<Modal id="SendFriendRequestModal">
			<div className="flex items-center justify-between pb-4">
				<p className="font-bold text-lg">{t("btn_add_friend")}</p>
			</div>
			<form onSubmit={handleSendRequestFriend}>
				<InputWithText>
					<Input type="text" name="username" label={t("txt_username")} autoComplete="off" errorMsg={errors.username} customLabelStyle="bg-base-100" />
				</InputWithText>
				<div className="flex gap-2 justify-end">
					<button onClick={() => {
						setErrors({})
						HideModal('SendFriendRequestModal')
					}} type="reset" className="btn btn-neutral">{t("btn_cancel")}</button>
					<button className="btn btn-info btn-outline">{t("btn_confirm")}</button>
				</div>
			</form>
		</Modal>

		<Modal id="BlockConfirmModal">
			<div className="pb-4">
				<p className="font-bold text-lg">{t("friend_block_confirm_title")}</p>
				<p className="text-sm opacity-60">{t("friend_block_confirm_desc")}</p>
			</div>
			<div className="flex gap-2 justify-end">
				<button onClick={() => {
					setBlockTarget(null)
					HideModal('BlockConfirmModal')
				}} type="reset" className="btn btn-neutral">{t("btn_cancel")}</button>
				<button className="btn btn-info btn-outline" onClick={() => {
					if (blockTarget)
						handleBlock(blockTarget ?? "")
					setBlockTarget(null)
					HideModal('BlockConfirmModal')
				}}>{t("btn_confirm")}</button>
			</div>
		</Modal>
	</Sidebar>
}

function DisplayMessage({ message, isMine }: { message: string, isMine: boolean }) {
	return <div className={`chat chat-${isMine ? 'end' : 'start'}`}>
		<div className={`chat-bubble max-w-[70%] whitespace-pre-wrap break-all ${isMine ? 'bg-info/25' : 'bg-neutral-content/15'}`}>{message}</div>
	</div>
}

function ConversationFriendDisplay({ friends, peerId, onBlock }: { friends: Friend[], peerId: string | null, onBlock: (id: string) => void }) {
	if (!peerId)
		return

	const friend = friends.find(f => f.id === peerId)
	if (!friend)
		return

	return <div className="flex items-center justify-between p-4 bg-base-200">
		<div className="flex items-center w-full gap-2">
			<Avatar username={friend?.username} image={friend?.image} size={40} />
			<div>
				<p className="text-sm">{friend?.username}</p>
				<p className="text-xs text-info">IN A MATCH - 2 v 2</p>
			</div>
		</div>
		<div className="flex items-center gap-2">
			<button className="btn btn-outline btn-neutral text-neutral-content btn-sm">{t("settings_profile_title")}</button>
			<button className="btn btn-outline btn-neutral text-neutral-content btn-sm">{t("btn_invite")}</button>
			<button onClick={() => onBlock(peerId)} className="btn btn-outline btn-error btn-sm">{t("btn_block")}</button>
		</div>
	</div>
}

function ConversationsSection({ conversations, onSelect, closeConv, peerId }: {
	conversations: ConversationSummary[],
	onSelect: (id: string) => void,
	closeConv: () => void,
	peerId: string | null
}) {
	const [isOpened, setIsOpened] = useState(true)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>{t("friends_conversations_title")}</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				{conversations.map(conv => (
					<ConversationsItem key={conv.peerId} username={conv.username} image={conv.image} lastMsg={conv.lastMessage} lastTimeMsg={formatTime(conv.lastAt)} isMine={conv.isMine} isRead={conv.unreadCount === 0} isSelected={peerId === conv.peerId} onSelect={() => {
						if (peerId === conv.peerId)
							closeConv()
						else
							onSelect(conv.peerId)
					}} />
				))}
			</ul>
		</li>
	</ul>
}

function ConversationsItem({ username, image, lastMsg, lastTimeMsg, isMine, isRead, isSelected, onSelect }: { username: string | null | undefined, image: string | null | undefined, lastMsg: string, lastTimeMsg: string, isMine: boolean, isRead: boolean, isSelected: boolean, onSelect: () => void }) {
	return <li className="py-0.5">
		<div className={`flex ${isSelected ? "bg-info/15" : ""}`} onClick={onSelect}>
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} />
				<div>
					<p>{truncateText(username ?? "", 11)}</p>
					<p className={`text-xs opacity-60 ${!isMine && !isRead ? "font-semibold" : ""}`}>{truncateText(lastMsg, 10)}</p>
				</div>
			</div>
			<div className="flex flex-col gap-2 items-end">
				<p className="text-xs">{lastTimeMsg}</p>
				{!isMine && !isRead && <div className="indicator">
					<span className="indicator-item status status-success mr-1"></span>
				</div>}
			</div>
		</div>
	</li>
}

function RequestsSection({ requests, onAccept, onDecline }: {
	requests: FriendRequest[],
	onAccept: (requestId: string) => void,
	onDecline: (requestId: string) => void,
}) {
	const [isOpened, setIsOpened] = useState(true)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>{t("friends_requests_title")}</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				{requests.map(req => (
					<RequestsItem key={req.id} username={req.username} image={req.image} onAccept={() => onAccept(req.id)} onDecline={() => onDecline(req.id)} />
				))}
			</ul>
		</li>
	</ul>
}

function RequestsItem({ username, image, onAccept, onDecline }: {
	username: string | null | undefined,
	image: string | null | undefined,
	onAccept: () => void,
	onDecline: () => void,
}) {
	return <li className="py-0.5">
		<div className="flex">
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} />
				<div>
					<p>{truncateText(username ?? "", 11)}</p>
				</div>
			</div>
			<div className="flex gap-1">
				<button onClick={onAccept} className="btn btn-xs bg-info/10 border border-info/50"><FaCheck className="text-info font-light" /></button>
				<button onClick={onDecline} className="btn btn-xs bg-error/10 border border-error/50"><RxCross1 className="text-error" /></button>
			</div>
		</div>
	</li>
}

function OnlineSection({ friends, presence, onSelect, closeConv, peerId }: {
	friends: Friend[],
	presence: Record<string, PresenceStatus>,
	onSelect: (id: string) => void,
	closeConv: () => void,
	peerId: string | null
}) {
	const [isOpened, setIsOpened] = useState(true)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>{t("friends_online_title")}</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				{friends.map(f => (
					<OnlineItem key={f.id} username={f.username} image={f.image} status={presence[f.id] ?? "available"} isSelected={peerId === f.id} onSelect={() => {
						if (peerId === f.id)
							closeConv()
						else
							onSelect(f.id)
					}} />
				))}
			</ul>
		</li>
	</ul>
}

function OnlineItem({ username, image, status, isSelected, onSelect }: { username: string | null | undefined, image: string | null | undefined, status: "available" | "in a match" | "away" | "offline", isSelected: boolean, onSelect: () => void }) {

	return <li className="py-0.5">
		<div className={`flex ${isSelected ? "bg-info/15" : ""}`} onClick={onSelect}>
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} status={status} />
				<div>
					<p>{truncateText(username ?? "", 11)}</p>
					<p className="text-xs opacity-60">{t(`txt_${status}`)}</p>
				</div>
			</div>
			{status !== "in a match" && <div>
				<button className="btn btn-xs btn-neutral btn-outline text-neutral-content">{t("btn_invite")}</button>
			</div>}
		</div>
	</li>
}

function OfflineSection({ friends, onSelect, closeConv, peerId }: {
	friends: Friend[],
	onSelect: (id: string) => void,
	closeConv: () => void,
	peerId: string | null
}) {
	const [isOpened, setIsOpened] = useState(true)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>{t("friends_offline_title")}</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				{friends.map(f => (
					<OfflineItem key={f.id} username={f.username} image={f.image} isSelected={peerId === f.id} onSelect={() => {
						if (peerId === f.id)
							closeConv()
						else
							onSelect(f.id)
					}} />
				))}
			</ul>
		</li>
	</ul>
}

function OfflineItem({ username, image, isSelected, onSelect }: { username: string | null | undefined, image: string | null | undefined, isSelected: boolean, onSelect: () => void }) {
	return <li className="py-0.5">
		<div className={`flex opacity-50 ${isSelected ? "bg-info/15" : ""}`} onClick={onSelect}>
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} status="offline" />
				<p>{truncateText(username ?? "", 11)}</p>
			</div>
		</div>
	</li>
}

function BlockSection({ blocked, onUnblock }: {
	blocked: Friend[],
	onUnblock: (id: string) => void
}) {
	const [isOpened, setIsOpened] = useState(false)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>{t("friends_block_title")}</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				{blocked.map(f => (
					<BlockItem key={f.id} username={f.username} image={f.image} onUnblock={() => onUnblock(f.id)} />
				))}
			</ul>
		</li>
	</ul>
}

function BlockItem({ username, image, onUnblock }: { username: string | null | undefined, image: string | null | undefined, onUnblock: () => void }) {
	return <li className="py-0.5">
		<div className="flex">
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} status={null} />
				<div>
					<p>{username}</p>
				</div>
			</div>
			<div>
				<button className="btn btn-xs btn-neutral btn-outline text-neutral-content" onClick={onUnblock}>{t("btn_unblock")}</button>
			</div>
		</div>
	</li>
}