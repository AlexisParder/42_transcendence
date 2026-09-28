import React, { useEffect, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Sidebar } from "../components/Sidebar";
import { useSocket } from "../components/socketContext";
import type { Friend, matchType, PresenceStatus, PresenceUpdate } from "../types/events";
import { t } from "../lib/translate";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { truncateText } from "../lib/truncateText";
import { TbPointFilled } from "react-icons/tb";
import { Togglebox } from "../components/Togglebox";
import { HideModal, Modal, ShowModal } from "../components/Modal";

type visibilityType = "private" | "public"
export function Play() {
	useDocumentTitle(t("play_title"))
	const socket = useSocket()
	const [friends, setFriends] = useState<Friend[]>([])
	const [presence, setPresence] = useState<Record<string, PresenceStatus>>({})
	const [code] = useState("S-K7X2Q9")
	const [visibility, setVisibility] = useState<visibilityType>("private")
	const [selectedMatchType, setSelectedMatchType] = useState<matchType | "BOT">("ONE_V_ONE")
	const [selectedMatchTypeTxt, setSelectedMatchTypeTxt] = useState<"1 v 1" | "2 v 2" | "FFA" | "Bot">("1 v 1")
	const [abilites, setAbilities] = useState(true)
	const [replace, setReplace] = useState(true)
	const [spectators, setSpectators] = useState(false)
	const [timeTurn, setTimeTurn] = useState(30)


	useEffect(() => {
		function onPresence(payload: PresenceUpdate) {
			setPresence(prev => ({ ...prev, [payload.userId]: payload.status }))
		}
		socket.on("presence_update", onPresence)

		return () => {
			socket.off("presence_update", onPresence)
		}
	}, [socket])

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

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadFriends()
	}, [])

	function handleChangeTimeTurn(value: number) {
		if (value < 10)
			value = 10
		else if (value > 60)
			value = 60

		setTimeTurn(value)
	}

	return <Sidebar>
		<SidebarRight friends={friends} presence={presence}>
			<div className="p-6 flex flex-col h-full min-h-0 min-w-0 max-lg:overflow-y-auto">
				<h1 className="text-2xl font-bold">New match</h1>
				<p className="text-sm text-neutral-content/40">Pick a format, then open it up or invite your crew.</p>

				<div className="py-2 grid grid-cols-4 max-lg:grid-cols-2 gap-4">
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "ONE_V_ONE" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "ONE_V_ONE") {
							setSelectedMatchType("ONE_V_ONE")
							setSelectedMatchTypeTxt("1 v 1")
						}
					}}>
						<p className="text-sm font-semibold">1 v 1</p>
						<p className="text-xs text-neutral-content/50">ranked</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "TWO_V_TWO" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "TWO_V_TWO") {
							setSelectedMatchType("TWO_V_TWO")
							setSelectedMatchTypeTxt("2 v 2")
						}
					}}>
						<p className="text-sm font-semibold">2 v 2</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">duo <TbPointFilled className="size-1" /> ranked</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "FOUR_FFA" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "FOUR_FFA") {
							setSelectedMatchType("FOUR_FFA")
							setSelectedMatchTypeTxt("FFA")
						}
					}}>
						<p className="text-sm font-semibold">FFA</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">3-4 players <TbPointFilled className="size-1" /> ranked</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "BOT" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "BOT") {
							setSelectedMatchType("BOT")
							setSelectedMatchTypeTxt("Bot")
							setVisibility("private")
						}
					}}>
						<p className="text-sm font-semibold">Against the bot</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">Practice <TbPointFilled className="size-1" /> unranked</p>
					</button>
				</div>

				<div className="py-2 grid grid-cols-2 max-lg:grid-cols-1 gap-4">
					<div className="rounded-md p-2 bg-neutral/10 border border-neutral/50">
						<p className="uppercase px-2 text-neutral-content/50">visibility</p>
						<div className="flex gap-2 p-2">
							<button className={`btn btn-outline ${visibility === "private" ? "border-info bg-info/15 hover:bg-info hover:text-black" : "border-neutral bg-neutral/15 hover:btn-neutral"} flex-1/2`} onClick={() => {
								if (visibility !== "private")
									setVisibility("private")
							}}>Private</button>
							<button className={`btn btn-outline ${visibility === "public" ? "border-info bg-info/15 hover:bg-info hover:text-black" : "border-neutral bg-neutral/15 hover:btn-neutral"} flex-1/2`} onClick={() => {
								if (visibility !== "public" && selectedMatchType !== "BOT")
									setVisibility("public")
							}} disabled={selectedMatchType === "BOT"}>Public</button>
						</div>
						<div className="bg-info/10 border border-info/50 border-dashed rounded-md px-4 py-2 m-2 flex items-center justify-between">
							<p className="uppercase text-info font-mono text-xl font-semibold, tracking-label">{code}</p>
							<button className="text-neutral-content/50 btn btn-xs btn-ghost" onClick={() => navigator.clipboard.writeText(code)}>Copy code</button>
						</div>
					</div>
					<div className="rounded-md p-2 bg-neutral/10 border border-neutral/50">
						<p className="uppercase px-2 text-neutral-content/50">rules</p>
						<div className="flex flex-col gap-2 px-2">
							<div className="flex items-center justify-between">
								<p className="text-xs text-neutral-content/80">Time per turn</p>
								<button onClick={() => ShowModal("timeTurnModal")} className="link-primary cursor-pointer outline-none">{timeTurn} s</button>
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80">Special abilities</p>
								<Togglebox name={`spec_ab`} type="info" checked={abilites} onClick={() => setAbilities(!abilites)} />
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80">Replace leavers with a bot</p>
								<Togglebox name={`spec_ab`} type="info" checked={replace} onClick={() => setReplace(!replace)} />
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80">Spectators</p>
								<Togglebox name={`spec_ab`} type="info" checked={spectators} onClick={() => setSpectators(!spectators)} />
							</div>
						</div>
					</div>
				</div>

				<div className="my-2 flex items-center justify-between bg-info/10 border border-info/50 rounded-md p-4">
					<p className="text-xs font-semibold flex items-center gap-1 ">{selectedMatchTypeTxt} <TbPointFilled className="size-1" /> {visibility} - {timeTurn} s turns {abilites ? ", abilities" : ""}</p>
					<button className="btn btn-info max-lg:btn-sm">Create match</button>
				</div>

				<div className="py-2 flex flex-col md:flex-1 md:min-h-0">
					<div className="flex items-center justify-between pb-2">
						<p className="uppercase text-neutral-content/50 text-xs">public matches</p>
						<p className=" text-neutral-content/50 text-xs">Refresh 3 s ago</p>
					</div>
					<div className="flex flex-col gap-2 py-2 md:flex-1 md:min-h-0 md:overflow-y-auto">
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
						<MatchItem username={"gael"} image={``} type={"FOUR_FFA"} players={2} maxPlayers={4} canJoin={true} />
						<MatchItem username={"tom"} image={``} type={"TWO_V_TWO"} players={3} maxPlayers={4} canJoin={true} />
						<MatchItem username={"alexis"} image={``} type={"ONE_V_ONE"} players={2} maxPlayers={2} canSpec={true} />
					</div>
				</div>
			</div>

			<Modal id="timeTurnModal">
				<p className="text-center">Turn time: 10 to 60 seconds</p>
				<div className="flex items-center py-4 gap-2 justify-center">
					<input type="range" min={10} max={60} value={timeTurn} onChange={(e) => handleChangeTimeTurn(Number(e.target.value))} className="range range-xs outline-none" />
					<p>{timeTurn}</p>
				</div>
				<div className="flex justify-center">
					<button className="btn btn-outline" onClick={() => HideModal("timeTurnModal")}>Close</button>
				</div>
			</Modal>
		</SidebarRight>
	</Sidebar>
}

function MatchItem({ username, image, type, players, maxPlayers, canJoin, canSpec }:
	{
		username: string | null | undefined,
		image: string | null | undefined,
		type: matchType | "BOT",
		players: number,
		maxPlayers: number,
		canJoin?: boolean,
		canSpec?: boolean
	}
) {
	let typeTxt = ""
	if (type === "ONE_V_ONE")
		typeTxt = "1 v 1"
	else if (type === "TWO_V_TWO")
		typeTxt = "2 v 2"
	else if (type === "THREE_FFA" || type === "FOUR_FFA")
		typeTxt = "3-4 players"

	return <div className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_6rem_4rem_6rem] gap-4 items-center bg-neutral/10 border border-neutral/50 rounded-md p-4">
		<div className={`flex gap-2 items-center ${canSpec ? "opacity-50" : ""}`}>
			<Avatar username={username} image={image} size={32} />
			<p className="text-sm font-semibold max-lg:hidden">{username}'s room</p>
			<div className="flex flex-col lg:hidden">
				<p className="text-xs font-semibold lg:hidden">{username}'s room</p>
				<p className="text-xs text-neutral-content/50 flex items-center gap-1">{typeTxt} <TbPointFilled className="size-1" /> {players} / {maxPlayers}</p>
			</div>
		</div>
		<p className="text-xs text-neutral-content/50 max-lg:hidden">{typeTxt}</p>
		<p className="text-xs text-neutral-content/50 max-lg:hidden">{players} / {maxPlayers}</p>
		{canJoin && <button className="btn btn-outline btn-info btn-sm">Join</button>}
		{!canJoin && canSpec && <button className="btn btn-neutral btn-outline btn-sm">Spectate</button>}
	</div>
}

function SidebarRight({ children, friends, presence }: {
	children: React.ReactNode,
	friends: Friend[],
	presence: Record<string, PresenceStatus>
}) {
	const onlineFriends = friends.filter(f => (presence[f.id] ?? f.status) !== "offline").length

	return <>
		<div className="flex w-full h-full min-h-0">
			<div className={`flex-1 min-w-0 min-h-0}`}>
				{children}
			</div>
			<div className={`max-lg:hidden lg:shrink-0 min-h-0`}>
				<ul className="menu flex-nowrap bg-base-200 h-full w-full p-4 gap-1">

					<div className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-1">
						<p className="uppercase text-xs text-neutral-content/50 font-mono">crew - {onlineFriends} online</p>
						<FriendSection friends={friends} presence={presence} />
					</div>

					<div className="bg-base-100 rounded-md">
						<div className="p-4 shrink-0 bg-warning/10 border border-warning/50 rounded-md flex flex-col gap-2">
							<h2 className="text-xs font-semibold text-warning">"Mariana Trench" tournament</h2>
							<p className="flex items-center gap-1 text-xs text-neutral-content/50">Registration open <TbPointFilled className="size-1" /> 6 / 8 seats <TbPointFilled className="size-1" /> starts in 12min</p>
						</div>
					</div>
				</ul>
			</div>
		</div>
	</>
}

function FriendSection({ friends, presence }: {
	friends: Friend[],
	presence: Record<string, PresenceStatus>
}) {
	return <>
		<ul className={`px-1 m-0`}>
			{friends.map(f => (
				<FriendItem key={f.id} username={f.username} image={f.image} status={presence[f.id] ?? "available"} />
			))}
		</ul>
	</>
}

function FriendItem({ username, image, status }: {
	username: string | null | undefined,
	image: string | null | undefined,
	status: "available" | "in a match" | "away" | "offline"
}) {
	return <div className={`py-1 flex ${status === "offline" ? "opacity-50" : ""}`}>
		<div className="flex items-center w-full gap-2">
			<Avatar username={username} image={image} size={32} status={status} />
			<div>
				<p>{truncateText(username ?? "", 11)}</p>
				<p className="text-xs opacity-60">{t(`txt_${status}`)}</p>
			</div>
		</div>
		{status === "available" && <div>
			<button className="btn btn-sm btn-info btn-outline">{t("btn_invite")}</button>
		</div>}
		{status === "away" && <div>
			<button className="btn btn-sm btn-neutral btn-outline text-neutral-content">{t("btn_invite")}</button>
		</div>}
		{status === "in a match" && <div>
			<button className="btn btn-sm btn-neutral btn-outline text-neutral-content">{t("btn_join")}</button>
		</div>}
	</div>
}