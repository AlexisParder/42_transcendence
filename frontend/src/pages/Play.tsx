import React, { useEffect, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Sidebar } from "../components/Sidebar";
import { useSocket } from "../components/socketContext";
import type { Friend, Matchs, matchType, PresenceStatus, PresenceUpdate, Rules } from "../types/events";
import { t } from "../lib/translate";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { TbPointFilled } from "react-icons/tb";
import { Togglebox } from "../components/Togglebox";
import { HideModal, Modal, ShowModal } from "../components/Modal";
import { BiCheck } from "react-icons/bi";
import { RxCross1 } from "react-icons/rx";
import { authClient } from "../lib/auth-client";
import { IoInformation, IoWarning } from "react-icons/io5";

type visibilityType = "private" | "public"
type viewType = "none" | "host" | "guest"
export function Play() {
	useDocumentTitle(t("play_title"))
	const { data: session } = authClient.useSession()
	const socket = useSocket()
	const [friends, setFriends] = useState<Friend[]>([])
	const [presence, setPresence] = useState<Record<string, PresenceStatus>>({})
	const [visibility, setVisibility] = useState<visibilityType>("private")
	const [selectedMatchType, setSelectedMatchType] = useState<matchType | "BOT">("ONE_V_ONE")
	const [abilities, setAbilities] = useState(true)
	const [replace, setReplace] = useState(true)
	const [spectators, setSpectators] = useState(false)
	const [timeTurn, setTimeTurn] = useState(30)
	const [view, setView] = useState<viewType>("none")
	const [matches, setMatches] = useState<Matchs[]>([])
	const [joinedMatch, setJoinedMatch] = useState<Matchs>()
	const [code, setCode] = useState("")

	useEffect(() => {
		function onPresence(payload: PresenceUpdate) {
			setPresence(prev => ({ ...prev, [payload.userId]: payload.status }))
		}
		function onRefreshMatch(payload: Matchs | undefined) {
			setJoinedMatch(payload)
			if (!payload)
				setView("none")
		}

		socket.on("presence_update", onPresence)
		socket.on("refresh_joined_match", onRefreshMatch)

		return () => {
			socket.off("presence_update", onPresence)
			socket.off("refresh_joined_match", onRefreshMatch)
		}
	}, [socket])

	useEffect(() => {
		async function loadJoinedMatch() {
			try {
				const res = await fetch("/api/get-joined-match", {
					method: "POST",
					headers: { "Content-type": "application/json" },
					credentials: "include",
				})

				if (!res.ok) {
					// setErrors({ form: t("settings_err_updt_pwd") })
					return
				}

				const data = await res.json()
				const match = data.match ?? undefined
				setJoinedMatch(match)

				if (match)
					setView(match.hostId === session?.user.id ? "host" : "guest")
			} catch (error) {
				console.error("load joined match:", error)
			}
		}

		loadJoinedMatch()
	}, [session?.user])

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

	async function loadMatches() {
		const res = await fetch("/api/get-matches", {
			method: "POST",
			headers: { "Content-type": "application/json" },
			credentials: "include"
		})

		if (!res.ok)
			return

		const data = await res.json()
		setMatches(data.matches ?? [])
	}

	useEffect(() => {
		if (view !== "none")
			return

		const interval = setInterval(() => {
			loadMatches()
		}, 5 * 1000)

		return () => {
			clearInterval(interval)
		}
	}, [view])

	useEffect(() => {
		if (view === "none")
			// eslint-disable-next-line react-hooks/set-state-in-effect
			loadMatches()
	}, [view])

	function handleChangeTimeTurn(value: number) {
		if (value < 10)
			value = 10
		else if (value > 60)
			value = 60

		setTimeTurn(value)
	}

	async function handleCreateMatch() {
		if (selectedMatchType === "BOT" && visibility !== "private")
			setVisibility("private")

		try {
			const res = await fetch("/api/create-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ selectedMatchType, visibility, timeTurn, abilities, replace, spectators }),
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			const data = await res.json()
			setJoinedMatch(data.match ?? undefined)

			setView("host")
		} catch (error) {
			console.error("create match:", error)
		}
	}

	async function handleDeleteMatch() {
		try {
			const res = await fetch("/api/delete-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			setJoinedMatch(undefined)
			setView("none")
		} catch (error) {
			console.error("delete match:", error)
		}
	}

	async function handleJoinedPublicMatch(match: Matchs) {
		if (match.visibility !== "public") {
			// setErrors({ form: t("settings_err_updt_pwd") })
			return
		}

		try {
			const res = await fetch("/api/join-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ hostId: match.hostId }),
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			const data = await res.json()
			setJoinedMatch(data.match ?? undefined)

			setView("guest")
		} catch (error) {
			console.error("join match:", error)
		}
	}

	async function handleLeaveMatch() {
		if (!joinedMatch)
			return

		try {
			const res = await fetch("/api/leave-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ hostId: joinedMatch.hostId }),
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			setJoinedMatch(undefined)
			setView("none")
		} catch (error) {
			console.error("leave match:", error)
		}
	}

	async function handleStatus() {
		if (!joinedMatch)
			return

		try {
			const res = await fetch("/api/update-player-status-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ hostId: joinedMatch.hostId }),
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			const data = await res.json()
			setJoinedMatch(data.match ?? undefined)
		} catch (error) {
			console.error("update player status match:", error)
		}
	}

	async function handleKick(targetId: string) {
		try {
			const res = await fetch("/api/kick-user-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ targetId }),
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			const data = await res.json()
			setJoinedMatch(data.match ?? undefined)
		} catch (error) {
			console.error("kick user match:", error)
		}
	}

	async function handleJoinWithCode() {
		try {
			const res = await fetch("/api/join-code-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ code }),
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			const data = await res.json()
			setJoinedMatch(data.match ?? undefined)
			setCode("")
			setView("guest")
		} catch (error) {
			console.error("join code match:", error)
		}
	}

	async function handleInvite(targetId: string) {
		if (!joinedMatch)
			return

		if (!joinedMatch.invitedPlayers.some(p => p === targetId)) {
			const res = await fetch("/api/invite-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ hostId: joinedMatch.hostId, peerId: targetId })
			})

			if (!res.ok) {
				// setErrors({ form: t("settings_err_updt_pwd") })
				return
			}
			socket.emit("send_message", { toUserId: targetId, message: joinedMatch.code.toUpperCase() })
		}
	}

	return <Sidebar>
		{view === "none" && <SidebarRight format={selectedMatchType} replace={replace}>
			<div className="p-6 flex flex-col h-full min-h-0 min-w-0 max-lg:overflow-y-auto">
				<div className="flex items-center justify-between max-sm:flex-col max-sm:gap-2 max-sm:pb-2">
					<div>
						<h1 className="text-2xl font-bold first-letter:uppercase">{t("play_new_match")}</h1>
						<p className="text-sm text-neutral-content/40 first-letter:uppercase">{t("play_desc")}.</p>
					</div>
					<div className="join max-sm:w-full">
						<input
							type="text"
							placeholder={`${t("home_code_name")} - - - - -`}
							className="input join-item w-40 bg-base-200 font-mono uppercase outline-none max-sm:w-full" value={code} onChange={(e) => setCode(e.target.value.trim())}
						/>
						<button className="btn join-item btn-info" onClick={handleJoinWithCode}>
							{t("home_join_btn")}
						</button>
					</div>
				</div>

				<div className="py-2 grid grid-cols-4 max-xl:grid-cols-2 gap-4">
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "ONE_V_ONE" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "ONE_V_ONE")
							setSelectedMatchType("ONE_V_ONE")
					}}>
						<p className="text-sm font-semibold">{t("txt_ONE_V_ONE")}</p>
						<p className="text-xs text-neutral-content/50">{t("txt_ranked")}</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "TWO_V_TWO" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "TWO_V_TWO")
							setSelectedMatchType("TWO_V_TWO")
					}}>
						<p className="text-sm font-semibold">{t("txt_TWO_V_TWO")}</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">{t("play_duo")} <TbPointFilled className="size-1" /> {t("txt_ranked")}</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "FOUR_FFA" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "FOUR_FFA")
							setSelectedMatchType("FOUR_FFA")
					}}>
						<p className="text-sm font-semibold">{t("txt_FFA")}</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">3-4 {t("play_players")} <TbPointFilled className="size-1" /> {t("txt_ranked")}</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "BOT" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "BOT") {
							setSelectedMatchType("BOT")
							setVisibility("private")
						}
					}}>
						<p className="text-sm font-semibold first-letter:uppercase">{t("play_against_bot")}</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">{t("play_practice")} <TbPointFilled className="size-1" /> {t("txt_unranked")}</p>
					</button>
				</div>

				<div className="py-2 grid grid-cols-2 max-xl:grid-cols-1 gap-4">
					<div className="rounded-md p-2 bg-neutral/10 border border-neutral/50">
						<p className="uppercase px-2 text-neutral-content/50">{t("play_visibility")}</p>
						<div className="flex gap-2 p-2">
							<button className={`btn btn-outline ${visibility === "private" ? "border-info bg-info/15" : "border-neutral bg-neutral/15 hover:btn-neutral hover:bg-neutral/50"} flex-1/2`} onClick={() => {
								if (visibility !== "private")
									setVisibility("private")
							}}>{t("play_private")}</button>
							<button className={`btn btn-outline ${visibility === "public" ? "border-info bg-info/15" : "border-neutral bg-neutral/15 hover:btn-neutral hover:bg-neutral/50"} flex-1/2`} onClick={() => {
								if (visibility !== "public" && selectedMatchType !== "BOT")
									setVisibility("public")
							}} disabled={selectedMatchType === "BOT"}>{t("play_public")}</button>
						</div>
					</div>
					<div className="rounded-md p-2 bg-neutral/10 border border-neutral/50">
						<p className="uppercase px-2 text-neutral-content/50">{t("rules_title")}</p>
						<div className="flex flex-col gap-2 px-2">
							<div className="flex items-center justify-between">
								<p className="text-xs text-neutral-content/80 first-letter:uppercase">{t("play_time_turn")}</p>
								<button onClick={() => ShowModal("timeTurnModal")} className="link-primary cursor-pointer outline-none">{timeTurn} s</button>
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80 first-letter:uppercase">{t("play_abilities")}</p>
								<Togglebox name={`spec_ab`} type="info" checked={abilities} onClick={() => setAbilities(!abilities)} />
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80 first-letter:uppercase">{t("play_replace")}</p>
								<Togglebox name={`spec_ab`} type="info" checked={replace} onClick={() => setReplace(!replace)} />
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80 first-letter:uppercase">{t("play_spectators")}</p>
								<Togglebox name={`spec_ab`} type="info" checked={spectators} onClick={() => setSpectators(!spectators)} />
							</div>
						</div>
					</div>
				</div>

				<div className="my-2 flex items-center justify-between bg-info/10 border border-info/50 rounded-md p-4">
					<p className="text-xs font-semibold">{t(`txt_${selectedMatchType}`)} - {t(`play_${visibility}`)} - {t("play_s_turns", { time: timeTurn })} {abilities ? `- ${t("play_abilities")}` : ""}</p>
					<button className="btn btn-info max-lg:btn-sm" onClick={handleCreateMatch}>{t("play_btn_create")}</button>
				</div>

				<div className="py-2 flex flex-col md:flex-1 md:min-h-0">
					<div className="flex items-center justify-between pb-2">
						<p className="uppercase text-neutral-content/50 text-xs">{t("play_public_matches")}</p>
					</div>
					<div className="flex flex-col gap-2 py-2 md:flex-1 md:min-h-0 md:overflow-y-auto">
						{/* ajouter un tri pour afficher les join avant les parties en cours (si elles peuvent etre spectate, sinon ne pas afficher) */}
						{matches.length > 0 && matches.map(m => (
							<MatchItem key={m.hostId} username={m.players.find(p => p.userId === m.hostId)?.username} image={m.players.find(p => p.userId === m.hostId)?.image} type={m.mode} players={m.players.length} maxPlayers={m.maxPlayers} canJoin={m.players.length !== m.maxPlayers} canSpec={m.settings.spectators && m.startedAt !== ""} handleJoinedPublicMatch={handleJoinedPublicMatch} match={m} />
						))}
						{matches.length < 1 && <p className="text-xs text-neutral-content/60">{t("txt_no_show_now")}..</p>}
					</div>
				</div>
			</div>

			<Modal id="timeTurnModal">
				<p className="text-center first-letter:uppercase">{t("play_modal_time", { min: 10, max: 60 })}</p>
				<div className="flex items-center py-4 gap-2 justify-center">
					<input type="range" min={10} max={60} value={timeTurn} onChange={(e) => handleChangeTimeTurn(Number(e.target.value))} className="range range-xs outline-none" />
					<p>{timeTurn}</p>
				</div>
				<div className="flex justify-center">
					<button className="btn btn-outline" onClick={() => HideModal("timeTurnModal")}>{t("btn_close")}</button>
				</div>
			</Modal>
		</SidebarRight>}

		{(view === "host" || view === "guest") && <WaitingRoom isHost={view === "host"} myId={session?.user.id} joinedMatch={joinedMatch} friends={friends} presence={presence} handleDeleteMatch={handleDeleteMatch} handleLeaveMatch={handleLeaveMatch} handleStatus={handleStatus} handleKick={handleKick} handleInvite={handleInvite} />}
	</Sidebar>
}

function WaitingRoom({ isHost, myId, joinedMatch, friends, presence, handleDeleteMatch, handleLeaveMatch, handleStatus, handleKick, handleInvite }: {
	isHost: boolean,
	myId: string | undefined,
	joinedMatch: Matchs | undefined,
	friends: Friend[],
	presence: Record<string, PresenceStatus>,
	handleDeleteMatch: () => void,
	handleLeaveMatch: () => void,
	handleStatus: () => void,
	handleKick: (id: string) => void,
	handleInvite: (targetId: string) => void
}) {
	if (!joinedMatch)
		return

	const hostname = joinedMatch.players.find(p => p.userId === joinedMatch.hostId)?.username
	const missing = joinedMatch.maxPlayers - joinedMatch.players.length
	const allReady = missing === 0 && joinedMatch.players.every(p => p.isReady)
	const me = joinedMatch.players.find(p => p.userId === myId)
	const rules: Rules = {
		format: joinedMatch.mode,
		timeTurn: joinedMatch.settings.time_turn,
		abilities: joinedMatch.settings.abilities,
		replace: joinedMatch.settings.replace,
		spectators: joinedMatch.settings.spectators,
		ranked: joinedMatch.isRanked
	}

	return <div className="flex flex-col h-full min-h-0">
		<div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4">
			<div className="flex items-start justify-between gap-4">
				<div className="min-h-0">
					<p className="flex items-center gap-1 uppercase text-info font-mono text-xs tracking-brand">{t("play_waiting_room")} <TbPointFilled className="size-1" /> {t(`play_${joinedMatch.visibility}`)}</p>
					<h1 className="text-2xl font-bold truncate">{t("play_room_name", { name: hostname ?? "?" })}</h1>
					<p className="text-xs text-neutral-content/50 max-lg:hidden first-letter:uppercase">
						{isHost ? `${t("play_room_host_desc")}.` : `${t("play_room_guest_desc")}.`}
					</p>
				</div>
				<div className="text-right shrink-0">
					<p className={`font-mono text-2xl font-bold ${missing === 0 ? "text-info" : ""}`}>{joinedMatch.players.length} / {joinedMatch.maxPlayers}</p>
					<p className="text-xs text-neutral-content/50 max-lg:hidden">{t("play_players")}</p>
				</div>
			</div>

			<div className="lg:hidden">
				<CodeBox code={joinedMatch.code} />
			</div>

			<div className="flex flex-col gap-2">
				<p className="lg:hidden uppercase text-xs text-neutral-content/50 font-mono">{t("play_players")}</p>
				<div className="flex flex-col gap-2 lg:grid lg:grid-cols-4 lg:gap-3">
					{joinedMatch.players.map(p => (
						<PlayerItem key={p.userId} username={p.username} image={p.image} points={p.points} isReady={p.isReady} isMine={p.userId === myId} isHost={p.userId === joinedMatch.hostId} canKick={isHost && p.userId !== joinedMatch.hostId} team={p.team} isDuo={joinedMatch.mode === "TWO_V_TWO"} handleKick={handleKick} userId={p.userId ?? ""} />
					))}
					{Array.from({ length: missing }).map((_, i) => <WaitingPlayerItem key={`empty_${i}`} />)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<RulesPanel isHost={isHost} rules={rules} />
				<div className="max-lg:hidden">
					<InvitePanel code={joinedMatch.code} friends={friends} presence={presence} handleInvite={handleInvite} invitedPlayers={joinedMatch.invitedPlayers} />
				</div>
			</div>
		</div>

		<WaitingRoomFooter isHost={isHost} allReady={allReady} missing={missing} total={joinedMatch.maxPlayers} isReady={me?.isReady ?? false} handleDeleteMatch={handleDeleteMatch} handleLeaveMatch={handleLeaveMatch} handleStatus={handleStatus} />
	</div>
}

function RadarWaiting({ className = "size-16" }: { className?: string }) {
	return <div className={`relative flex items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-base-200 bg-radar-glow ${className}`}>
		<div className="absolute w-3/4 h-3/4 rounded-full border border-primary/15" />
		<div className="absolute w-1/2 h-1/2 rounded-full border border-primary/15" />
		<div className="absolute w-1/4 h-1/4 rounded-full border border-primary/15" />

		<div className="absolute h-full w-px bg-primary/15" />
		<div className="absolute w-full h-px bg-primary/15" />

		<div className="absolute w-1/4 h-1/4 rounded-full bg-primary/5 blur-xl" />

		<div className="absolute inset-0 flex justify-center rounded-full bg-radar-sweep animate-sweep motion-reduce:animate-none">
			<div className="h-1/2 w-px bg-primary/70" />
		</div>
	</div>
}

function WaitingPlayerItem() {
	return <div className="flex items-center gap-3 p-3 border border-dashed border-neutral/50 rounded-lg lg:flex-col lg:justify-center lg:gap-2 lg:h-52">
		<RadarWaiting className="size-12 lg:size-16" />
		<p className="uppercase text-neutral-content/50 font-mono text-xs">
			<span className="lg:hidden">{t("play_waiting")}...</span>
			<span className="max-lg:hidden">{t("play_waiting_player")}</span>
		</p>
	</div>
}

function PlayerItem({ userId, username, image, points, isReady, isMine, isHost, canKick, team, isDuo, handleKick }: {
	userId: string,
	username: string | null | undefined,
	image: string | null | undefined,
	points: number,
	isReady: boolean,
	isMine: boolean,
	isHost: boolean,
	canKick: boolean,
	team: number,
	isDuo: boolean,
	handleKick: (id: string) => void
}) {
	return <div className={`flex items-center gap-3 p-3	border rounded-lg lg:flex-col lg:justify-between lg:gap-1 lg:h-52 lg:p-2.5 ${isMine ? "bg-ingo/10 border-info/50" : "bg-neutral/10 border-neutral/50"}`}>
		<div className="max-lg:hidden flex justify-end items-center h-4 w-full">
			{isHost && <HostBadge />}
			{!isHost && canKick && <KickButton handleKick={handleKick} targetId={userId} />}
		</div>

		<div className="flex items-center gap-3 flex-1 min-w-0 lg:flex-none lg:flex-col lg:gap-1">
			<Avatar username={username} image={image} size={48} />
			<div className="min-w-0 lg:text-center">
				<p className="text-sm font-semibold flex items-center gap-2 lg:justify-center">
					<span className="truncate">{username}</span>
					{isMine && <span className="text-xs text-neutral-content/50 font-medium">({t("play_you")})</span>}
					{isHost && <span className="lg:hidden"><HostBadge /></span>}
				</p>
				<p className="text-xs text-neutral-content/50 font-mono">{points.toLocaleString()} {t("txt_pts")}</p>
				{isDuo && <p className={`text-xs ${team === 1 ? "text-info/75" : "text-error/75"} font-mono`}>{team === 1 ? "Blue team" : "Red team"}</p>}
			</div>
		</div>

		<div className="flex items-center gap-2 shrink-0">
			<ReadyBadge isReady={isReady} />
			{!isHost && canKick && <span className="lg:hidden"><KickButton handleKick={handleKick} targetId={userId} /></span>}
		</div>
	</div>
}

function HostBadge() {
	return <span className="badge badge-warning badge-xs badge-outline uppercase">{t("play_host")}</span>
}

function KickButton({ targetId, handleKick }: {
	targetId: string,
	handleKick: (id: string) => void
}) {
	return <button className="cursor-pointer text-neutral-content/50 hover:text-error" onClick={() => handleKick(targetId)}><RxCross1 className="size-4" /></button>
}

function ReadyBadge({ isReady }: { isReady: boolean }) {
	return isReady
		? <p className="flex gap-1 items-center uppercase bg-info/10 border border-info/50 rounded-xl py-0.5 px-2 text-xs text-info"><BiCheck /> {t("play_ready")}</p>
		: <p className="flex gap-1 items-center uppercase bg-neutral/10 border border-neutral/50 rounded-xl py-0.5 px-2 text-xs text-neutral-content/50">{t("play_not_ready")}</p>
}

function CodeBox({ code }: { code: string }) {
	return <div className="flex items-center justify-between gap-2 bg-info/10 border border-dashed border-info/50 rounded-md px-4 py-3">
		<p className="text-info font-mono text-xl font-semibold tracking-brand uppercase">{code}</p>
		<button className="btn btn-xs btn-ghost text-neutral-content/50" onClick={() => navigator.clipboard.writeText(code.toUpperCase())}>{t("btn_copy_code")}</button>
	</div>
}

function RulesPanel({ rules }: { isHost: boolean, rules: Rules }) {
	const summary = [
		t(`txt_${rules.format}`),
		t("play_s_turns", { time: rules.timeTurn }),
		rules.abilities ? t("play_abilities_on") : t("play_abilities_off"),
		rules.replace ? t("play_bot_replace") : null,
		rules.ranked ? t("txt_ranked") : t("txt_unranked"),
	].filter(Boolean).join(" - ")

	return <div className="rounded-lg border border-neutral/50 bg-neutral/10 p-4">
		<div className="flex items-center justify-between pb-2">
			<p className="uppercase text-xs text-neutral-content/50 font-mono">{t("rules_title")}</p>
		</div>

		<p className="lg:hidden text-sm text-neutral-content/80">{summary}</p>

		<div className="max-lg:hidden flex flex-col gap-2 text-xs">
			<RuleRow label={t("play_format")} value={t(`txt_${rules.format}`)} />
			<RuleRow label={t("play_time_turn")} value={`${rules.timeTurn} s`} highlight />
			<RuleRow label={t("play_abilities")} value={rules.abilities ? t("txt_on") : t("txt_off")} highlight={rules.abilities} />
			<RuleRow label={t("play_replace")} value={rules.replace ? t("txt_on") : t("txt_off")} highlight={rules.replace} />
			<RuleRow label={t("play_spectators")} value={rules.spectators ? t("txt_on") : t("txt_off")} highlight={rules.spectators} />
			<RuleRow label={t("txt_ranked")} value={rules.ranked ? t("txt_yes") : t("txt_no")} />
		</div>
	</div>
}

function RuleRow({ label, value, highlight }: {
	label: string,
	value: string,
	highlight?: boolean
}) {
	return <div className="flex items-center justify-between">
		<p className="text-neutral-content/80 first-letter:uppercase">{label}</p>
		<p className={`font-mono ${highlight ? "text-info" : ""}`}>{value}</p>
	</div>
}

function InvitePanel({ code, friends, presence, invitedPlayers, handleInvite }: {
	code: string,
	friends: Friend[],
	presence: Record<string, PresenceStatus>,
	invitedPlayers: string[],
	handleInvite: (targetId: string) => void
}) {
	const available = friends.filter(f => (presence[f.id] ?? f.status) !== "offline")

	return <div className="rounded-lg border border-neutral/50 bg-neutral/10 p-4 flex flex-col gap-3 h-full">
		<p className="uppercase text-xs text-neutral-content/50 font-mono">{t("btn_invite")}</p>
		<CodeBox code={code} />
		<div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
			{available.map(f => (
				<div key={f.id} className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<Avatar username={f.username} image={f.image} size={24} />
						<p className="text-xs font-semibold truncate">{f.username}</p>
					</div>
					<button disabled={invitedPlayers.some(p => p === f.id)} onClick={() => handleInvite(f.id)} className="btn btn-xs btn-info">{t("btn_invite")}</button>
				</div>
			))}
		</div>
	</div >
}

function WaitingRoomFooter({ isHost, allReady, missing, total, isReady, handleDeleteMatch, handleLeaveMatch, handleStatus }: {
	isHost: boolean,
	allReady: boolean,
	missing: number,
	total: number,
	isReady: boolean,
	handleDeleteMatch: () => void,
	handleLeaveMatch: () => void,
	handleStatus: () => void
}) {
	let title: string
	let detail = ""
	if (allReady) {
		title = t("play_all_players_ready", { nb: total })
		detail = isHost ? t("play_everyone_waiting") : t("play_waiting_host")
	} else if (missing > 0) {
		title = t("play_waiting_more_players", { missing })
		detail = isHost ? "" : t("play_only_host_start")
	} else
		title = "Waiting for everyone to be ready."

	return <div className="shrink-0 p-4 lg:px-6 lg:pb-6 max-lg:border-t max-lg:border-neutral/50">
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:bg-neutral/10 lg:border lg:border-neutral/50 lg:rounded-lg lg:p-4">
			<p className="text-xs flex items-center gap-2">
				<span className={`size-2 shrink-0 rounded-full ${allReady ? "bg-info" : "bg-warning"}`} />
				<span className="font-semibold first-letter:uppercase">{title}</span>
				{detail && <span className="text-neutral-content/50 max-lg:hidden">{detail}</span>}
			</p>

			<div className="flex flex-col-reverse gap-2 lg:flex-row">
				{isHost
					? <>
						<button className="btn btn-ghost text-error lg:btn-outline lg:btn-error" onClick={handleDeleteMatch}>{t("play_btn_close_room")}</button>
						<button className="btn btn-info max-lg:btn-lg" disabled={!allReady}>{t("play_btn_start_match")}</button>
					</>
					: <>
						<button className="btn btn-ghost lg:btn-outline" onClick={handleLeaveMatch}>{t("play_btn_leave_room")}</button>
						<button className={`btn max-lg:btn-lg ${isReady ? "btn-outline" : "btn-info btn-outline"}`} onClick={handleStatus}>{isReady ? t("play_cancel_ready") : <><BiCheck /> {t("play_ready")}</>}</button>
					</>}
			</div>
		</div>
	</div>
}

function MatchItem({ username, image, type, players, maxPlayers, canJoin, canSpec, match, handleJoinedPublicMatch }:
	{
		username: string | null | undefined,
		image: string | null | undefined,
		type: matchType | "BOT",
		players: number,
		maxPlayers: number,
		canJoin?: boolean,
		canSpec?: boolean,
		match: Matchs,
		handleJoinedPublicMatch: (match: Matchs) => void,
	}
) {
	let typeTxt = ""
	if (type === "ONE_V_ONE")
		typeTxt = t("txt_ONE_V_ONE")
	else if (type === "TWO_V_TWO")
		typeTxt = t("txt_TWO_V_TWO")
	else if (type === "THREE_FFA" || type === "FOUR_FFA")
		typeTxt = `3-4 ${t("play_players")}`

	return <div className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_6rem_4rem_6rem] gap-4 items-center bg-neutral/10 border border-neutral/50 rounded-md p-4">
		<div className={`flex gap-2 items-center ${canSpec ? "opacity-50" : ""}`}>
			<Avatar username={username} image={image} size={32} />
			<p className="text-sm font-semibold max-lg:hidden">{t("play_room_name", { name: username ?? "?" })}</p>
			<div className="flex flex-col lg:hidden">
				<p className="text-xs font-semibold lg:hidden">{t("play_room_name", { name: username ?? "?" })}</p>
				<p className="text-xs text-neutral-content/50 flex items-center gap-1">{typeTxt} <TbPointFilled className="size-1" /> {players} / {maxPlayers}</p>
			</div>
		</div>
		<p className="text-xs text-neutral-content/50 max-lg:hidden">{typeTxt}</p>
		<p className="text-xs text-neutral-content/50 max-lg:hidden">{players} / {maxPlayers}</p>
		{canJoin && <button className="btn btn-outline btn-info btn-sm" onClick={() => handleJoinedPublicMatch(match)} >{t("btn_join")}</button>}
		{!canJoin && canSpec && <button className="btn btn-neutral btn-outline btn-sm">{t("btn_spectate")}</button>}
	</div>
}

function SidebarRight({ children, format, replace }: {
	children: React.ReactNode,
	format: matchType | "BOT",
	replace: boolean
}) {
	let players = "3-4"
	if (format === "ONE_V_ONE")
		players = "2"
	else if (format === "BOT")
		players = "1"
	else if (format === "TWO_V_TWO")
		players = "4"

	let ranked = "ON"
	if (format === "BOT" || replace)
		ranked = "OFF"

	return <>
		<div className="flex w-full h-full min-h-0">
			<div className={`flex-1 min-w-0 min-h-0}`}>
				{children}
			</div>
			<div className={`max-lg:hidden lg:shrink-0 min-h-0`}>
				<ul className="menu flex-nowrap bg-base-200 h-full w-full p-4 gap-1">
					<div className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-1 max-w-75">
						<p className="text-xs uppercase text-neutral-content/50 font-mono">selected format</p>
						<h2 className="font-bold text-xl">{t(`txt_${format}`)}</h2>

						<SidebarRightItem label="player" value={players} />
						<SidebarRightItem label="grid" value="14x14" />
						<SidebarRightItem label="ships per fleet" value="4" />
						<SidebarRightItem label="ranked" value={ranked} />

						{ranked !== "ON" && <div className="bg-base-100 rounded-md m-1">
							<p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4 text-neutral-content/60 text-xs"><IoWarning className="text-warning size-7" /> Ranked is off because Replace leavers with a bot is on. Turn it off to play for points.</p>
						</div>}

						<div className="bg-base-100 rounded-md m-1">
							<p className="border border-neutral/50 bg-neutral/10 rounded-md p-4 flex items-center gap-4 text-neutral-content/60 text-xs"><IoInformation className="text-neutral size-7" /> Sink every enemy to win. Leaving a ranked match early counts as a loss.</p>
						</div>
					</div>
				</ul>
			</div>
		</div>
	</>
}

function SidebarRightItem({ label, value }: { label: string, value: string }) {
	return <>
		<div className="flex items-center justify-between p-1">
			<p className="first-letter:uppercase text-xs text-neutral-content/60">{label}</p>
			<p className={`font-mono text-xs font-medium ${value === "OFF" ? "text-warning" : ""}`}>{value}</p>
		</div>
		<div className="divider p-0 m-0"></div>
	</>
}