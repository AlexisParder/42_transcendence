import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Input } from "../components/Input";
import { Sidebar } from "../components/Sidebar";
import { FaCheck, FaPlus } from "react-icons/fa6";
import { RxCross1 } from "react-icons/rx";
// import { t } from "../lib/translate";

type Message = {
	id: number,
	content: string,
	isMine: boolean,
}
export function Friends() {
	const [messages, setMessages] = useState<Message[]>([])
	const scrollRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		fetch("/api/...")
			.then((res) => res.json())
			.then((data) => setMessages(data));
	}, [])

	useLayoutEffect(() => {
		const el = scrollRef.current;
		if (el)
			el.scrollTop = el.scrollHeight
	}, [messages])

	return <Sidebar>
		<div className="flex">
			{/* Centre (tchat) */}
			<div className="flex flex-1 flex-col h-screen">
				{/* haut */}
				<div className="flex items-center justify-between p-4 bg-base-200">
					<div className="flex items-center w-full gap-2">
						<Avatar username="Tom" image={``} size={40} />
						<div>
							<p className="text-sm">Tom</p>
							<p className="text-sm text-info">IN A MATCH - 2 v 2</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button className="btn btn-outline btn-neutral text-neutral-content">Profile</button>
						<button className="btn btn-outline btn-neutral text-neutral-content">Invite</button>
						<button className="btn btn-outline btn-error">Block</button>
					</div>
				</div>

				{/* tchat */}
				<div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
					<div className="flex flex-col justify-end min-h-full">
						{messages.map((msg) => <DisplayMessage key={msg.id} message={msg.content} isMine={msg.isMine} />)}

						<DisplayMessage isMine={false} message="What kind of nonsense is this" />
						<DisplayMessage isMine={false} message="Put me on the Council and not make me a Master!?" />
						<DisplayMessage isMine={false} message="That's never been done in the history of the Jedi." />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="It's insulting!" />
						<DisplayMessage isMine={false} message="Put me on the Council and not make me a Master!?" />
						<DisplayMessage isMine={true} message="Calm down, Anakin." />
						<DisplayMessage isMine={false} message="Put me on the Council and not make me a Master!?" />
					</div>
				</div>

				{/* bas */}
				<div className="flex items-center justify-between p-2 bg-base-200 gap-4">
					<div className="w-full pl-2">
						<Input type="text" name="message" label="Message" />
					</div>
					<button className="btn btn-outline btn-info">Send</button>
				</div>
			</div>

			{/* Droite */}
			<div className="flex flex-col bg-base-200 h-screen">
				{/* Haut */}
				<div className="p-2">
					<Input type="text" name="search" label="Search friends..." />
				</div>
				{/* Milieu */}
				<div className="flex-1 md:min-w-65 lg:min-w-75 overflow-y-auto">
					<div className="min-h-full">
						<ConversationsSection />
						<RequestsSection />
						<OnlineSection />
						<OfflineSection />
					</div>
				</div>
				{/* Bas */}
				<div className="p-6">
					<button className="flex items-center gap-2"><FaPlus /> Add a friend</button>
				</div>
			</div>
		</div>
	</Sidebar>
}

function DisplayMessage({ message, isMine }: { message: string, isMine: boolean }) {
	return <div className={`chat chat-${isMine ? 'end' : 'start'}`}>
		<div className={`chat-bubble bg-${isMine ? 'bg-info/25' : 'neutral-content/15'}`}>{message}</div>
	</div>
}

function ConversationsSection() {
	const [isOpened, setIsOpened] = useState(true)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>conversations</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				<ConversationsItem username="tom" image={``} lastMsg="J'ai pas à manger" lastTimeMsg="2 min" isMine={false} isRead={false} />
				<ConversationsItem username="tom" image={``} lastMsg="J'ai pas à manger" lastTimeMsg="2 min" isMine={true} isRead={true} />
				<ConversationsItem username="tom" image={``} lastMsg="J'ai pas à manger" lastTimeMsg="2 min" isMine={true} isRead={false} />
			</ul>
		</li>
	</ul>
}

function ConversationsItem({ username, image, lastMsg, lastTimeMsg, isMine, isRead }: { username: string, image: string | null | undefined, lastMsg: string, lastTimeMsg: string, isMine: boolean, isRead: boolean }) {
	return <li className="py-0.5">
		<div className="flex">
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} />
				<div>
					<p className="first-letter:uppercase">{username}</p>
					<p className={`text-xs opacity-60 ${!isMine && !isRead ? "font-semibold" : ""}`}>{lastMsg}</p>
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

function RequestsSection() {
	const [isOpened, setIsOpened] = useState(true)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>requests</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				<RequestsItem username={"alexis"} image={``} />
				<RequestsItem username={"alexis"} image={``} />
				<RequestsItem username={"alexis"} image={``} />
			</ul>
		</li>
	</ul>
}

function RequestsItem({ username, image }: { username: string, image: string | null | undefined }) {
	return <li className="py-0.5">
		<div className="flex">
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} />
				<div>
					<p className="first-letter:uppercase">{username}</p>
				</div>
			</div>
			<div className="flex gap-1">
				<button className="btn btn-xs bg-info/10 border border-info/50"><FaCheck className="text-info font-light" /></button>
				<button className="btn btn-xs bg-error/10 border border-error/50"><RxCross1 className="text-error" /></button>
			</div>
		</div>
	</li>
}

function OnlineSection() {
	const [isOpened, setIsOpened] = useState(true)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>online</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				<OnlineItem username={"gael"} image={``} status={"in a match"} />
				<OnlineItem username={"gael"} image={``} status={"available"} />
				<OnlineItem username={"gael"} image={``} status={"away"} />
			</ul>
		</li>
	</ul>
}

function OnlineItem({ username, image, status }: { username: string, image: string | null | undefined, status: "available" | "in a match" | "away" }) {
	return <li className="py-0.5">
		<div className="flex">
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} status={status} />
				<div>
					<p className="first-letter:uppercase">{username}</p>
					<p className="text-xs opacity-60">{status}</p>
				</div>
			</div>
			{status !== "in a match" && <div>
				<button className="btn btn-xs btn-neutral btn-outline text-neutral-content">Invite</button>
			</div>}
		</div>
	</li>
}

function OfflineSection() {
	const [isOpened, setIsOpened] = useState(false)

	return <ul className="menu menu-paged bg-base-200 w-full">
		<li>
			<span className={`menu-dropdown-toggle ${isOpened ? "menu-dropdown-show" : ""} uppercase`} onClick={() => setIsOpened(!isOpened)}>offline</span>
			<ul className={`menu-dropdown ${isOpened ? "menu-dropdown-show" : ""} px-1 m-0`}>
				<OfflineItem username={"tiben"} image={``} />
				<OfflineItem username={"tiben"} image={``} />
				<OfflineItem username={"tiben"} image={``} />
			</ul>
		</li>
	</ul>
}

function OfflineItem({ username, image }: { username: string, image: string | null | undefined }) {
	return <li className="py-0.5">
		<div className="flex opacity-50">
			<div className="flex items-center w-full gap-2">
				<Avatar username={username} image={image} size={32} status="offline" />
				<p className="first-letter:uppercase">{username}</p>
			</div>
		</div>
	</li>
}