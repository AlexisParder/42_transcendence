import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { useSocket } from "../components/socketContext";
import type { Friend, Matchs, matchType, PresenceStatus, PresenceUpdate } from "../types/events";
import { t } from "../lib/translate";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Togglebox } from "../components/Togglebox";
import { HideModal, Modal, ShowModal } from "../components/Modal";
import { authClient } from "../lib/auth-client";
import { SidebarRight, MatchItem, WaitingRoom } from "./utils/utilsPlay";

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
	const [abilities, setAbilities] = useState(false)
	const [replace, setReplace] = useState(false)
	const [spectators, setSpectators] = useState(false)
	const [timeTurn, setTimeTurn] = useState(30)
	const [view, setView] = useState<viewType>("none")
	const [matches, setMatches] = useState<Matchs[]>([])
	const [joinedMatch, setJoinedMatch] = useState<Matchs>()
	const [code, setCode] = useState("")
	const [errors, setErrors] = useState<{ matchCreation?: string, matchWaiting?: string, matchJoin?: string, matchJoinCode?: string }>({})

	const ranked = !replace

	const visibleMatches = matches.map(m => {
		const started = m.startedAt !== ""
		const canJoin = !started && m.players.length < m.maxPlayers
		const canSpec = started && m.settings.spectators
		const host = m.players.find(p => p.userId === m.hostId)
		return { m, host, canJoin, canSpec }
	}).filter(({ canJoin, canSpec }) => canJoin || canSpec)
		.sort((a, b) => Number(b.canJoin) - Number(a.canJoin))

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

				if (!res.ok)
					return

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

			const data = await res.json()
			if (!res.ok) {
				setErrors({ matchCreation: data.code ? t(data.code) : t("match_err_creation_failure") })
				return
			}

			setJoinedMatch(data.match ?? undefined)
			setView("host")
			setErrors({})
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

			const data = await res.json()
			if (!res.ok) {
				setErrors({ matchWaiting: data.code ? t(data.code) : t("match_err_delete_failure") })
				return
			}

			setJoinedMatch(undefined)
			setView("none")
			setErrors({})
		} catch (error) {
			console.error("delete match:", error)
		}
	}

	async function handleJoinedPublicMatch(match: Matchs) {
		if (match.visibility !== "public")
			return

		try {
			const res = await fetch("/api/join-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ hostId: match.hostId }),
			})

			const data = await res.json()

			if (!res.ok) {
				setErrors({ matchJoin: data.code ? t(data.code) : t("match_err_join_failure") })
				return
			}

			setJoinedMatch(data.match ?? undefined)
			setView("guest")
			setErrors({})
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

			const data = await res.json()

			if (!res.ok) {
				setErrors({ matchWaiting: data.code ? t(data.code) : t("match_err_leave_failure") })
				return
			}

			setJoinedMatch(undefined)
			setView("none")
			setErrors({})
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

			const data = await res.json()

			if (!res.ok) {
				setErrors({ matchWaiting: data.code ? t(data.code) : t("match_err_status_update_failure") })
				return
			}

			setJoinedMatch(data.match ?? undefined)
			setErrors({})
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

			const data = await res.json()

			if (!res.ok) {
				setErrors({ matchWaiting: data.code ? t(data.code) : t("match_err_kick_failure") })
				return
			}

			setJoinedMatch(data.match ?? undefined)
			setErrors({})
		} catch (error) {
			console.error("kick user match:", error)
		}
	}

	async function handleJoinWithCode() {
		if (!code)
			return setErrors({})

		try {
			const res = await fetch("/api/join-code-match", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ code }),
			})

			const data = await res.json()

			if (!res.ok) {
				setErrors({ matchJoinCode: data.code ? t(data.code) : t("match_err_join_failure") })
				return
			}

			setJoinedMatch(data.match ?? undefined)
			setCode("")
			setView("guest")
			setErrors({})
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

			const data = await res.json()

			if (!res.ok) {
				setErrors({ matchWaiting: data.code ? t(data.code) : t("match_err_invite_failure") })
				return
			}
			socket.emit("send_message", { toUserId: targetId, message: joinedMatch.code.toUpperCase() })
			setErrors({})
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
					<div className="flex flex-col justify-between md:items-end">
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
						{errors.matchJoinCode && <span className="text-error block pt-0.5 pb-2 pl-2 text-xs text-center">{errors.matchJoinCode}</span>}
					</div>
				</div>

				<div className="py-2 grid grid-cols-4 max-xl:grid-cols-2 gap-4">
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "ONE_V_ONE" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "ONE_V_ONE")
							setSelectedMatchType("ONE_V_ONE")
					}}>
						<p className="text-sm font-semibold">{t("txt_ONE_V_ONE")}</p>
						<p className="text-xs text-neutral-content/50">{ranked ? t("txt_ranked") : t("txt_unranked")}</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "TWO_V_TWO" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "TWO_V_TWO")
							setSelectedMatchType("TWO_V_TWO")
					}}>
						<p className="text-sm font-semibold">{t("txt_TWO_V_TWO")}</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">{t("play_duo")}, {ranked ? t("txt_ranked") : t("txt_unranked")}</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "FOUR_FFA" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "FOUR_FFA")
							setSelectedMatchType("FOUR_FFA")
					}}>
						<p className="text-sm font-semibold">{t("txt_FFA")}</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">3-4 {t("play_players")}, {ranked ? t("txt_ranked") : t("txt_unranked")}</p>
					</button>
					<button className={`cursor-pointer rounded-md p-4 ${selectedMatchType === "BOT" ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} text-left`} onClick={() => {
						if (selectedMatchType !== "BOT") {
							setSelectedMatchType("BOT")
							setVisibility("private")
						}
					}}>
						<p className="text-sm font-semibold first-letter:uppercase">{t("play_against_bot")}</p>
						<p className="text-xs text-neutral-content/50 flex items-center gap-1">{t("play_practice")}, {t("txt_unranked")}</p>
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
								<Togglebox name={`spec_ab`} type="info" checked={abilities} onChange={() => setAbilities(!abilities)} />
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80 first-letter:uppercase">{t("play_replace")}</p>
								<Togglebox name={`spec_ab`} type="info" checked={replace} onChange={() => setReplace(!replace)} />
							</div>
							<div className="flex justify-between">
								<p className="text-xs text-neutral-content/80 first-letter:uppercase">{t("play_spectators")}</p>
								<Togglebox name={`spec_ab`} type="info" checked={spectators} onChange={() => setSpectators(!spectators)} />
							</div>
						</div>
					</div>
				</div>

				<div className="my-2 flex items-center justify-between bg-info/10 border border-info/50 rounded-md p-4">
					<p className="text-xs font-semibold">{t(`txt_${selectedMatchType}`)} - {t(`play_${visibility}`)} - {t("play_s_turns", { time: timeTurn })} {abilities ? `- ${t("play_abilities")}` : ""}</p>
					<div className="flex flex-col justify-between items-end">
						<button className="btn btn-info max-lg:btn-sm text-nowrap" onClick={handleCreateMatch}>{t("play_btn_create")}</button>
						{errors.matchCreation && <span className="text-error block pt-0.5 pb-2 pl-2 text-xs text-center">{errors.matchCreation}</span>}
					</div>
				</div>

				<div className="py-2 flex flex-col md:flex-1 md:min-h-0">
					<div className="flex items-center justify-between pb-2">
						<p className="uppercase text-neutral-content/50 text-xs">{t("play_public_matches")}</p>
					</div>
					<div className="flex flex-col gap-2 py-2 md:flex-1 md:min-h-0 md:overflow-y-auto">
						{visibleMatches.length > 0 && visibleMatches.map(({ m, host, canJoin, canSpec }) => (
							<MatchItem
								key={m.hostId}
								username={host?.username}
								image={host?.image}
								type={m.mode}
								players={m.players.length}
								maxPlayers={m.maxPlayers}
								canJoin={canJoin}
								canSpec={canSpec}
								handleJoinedPublicMatch={handleJoinedPublicMatch}
								match={m}
								joinMatchErr={errors.matchJoin} />
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

		{(view === "host" || view === "guest") && <WaitingRoom isHost={view === "host"} myId={session?.user.id} joinedMatch={joinedMatch} friends={friends} presence={presence} handleDeleteMatch={handleDeleteMatch} handleLeaveMatch={handleLeaveMatch} handleStatus={handleStatus} handleKick={handleKick} handleInvite={handleInvite} MatchErr={errors.matchWaiting} />}
	</Sidebar>
}