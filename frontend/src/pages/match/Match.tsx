import { useEffect, useRef, useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Game, GameStats, MatchHeader, GameInfos } from "./matchUtils";
import { Deployment, DeploymentFooter, DeploymentInfos, Dock } from "./selectUtils";
import type { Matchs, Ship, ShipName, vect2 } from "../../types/events";
import { useSocket } from "../../components/socketContext";
import { authClient } from "../../lib/auth-client";
import { apiPost } from "../../lib/api";
import { t } from "../../lib/translate";
import type { shipRotation } from "../../types/types";
import { EndDisplay, EndSpecDisplay } from "./endUtils";
import { HideModal, Modal, ShowModal } from "../../components/Modal";
import { Navigate, useNavigate } from "react-router-dom";
import { isSpectator } from "../../lib/spectator";
import { IoIosBoat } from "react-icons/io";

type categoryType = "select" | "match"
export type gameInfosViewType = "logs" | "chat"
export function Match() {
	useDocumentTitle(t("match_title"))

	const { data: session, isPending } = authClient.useSession()
	const socket = useSocket()
	const navigate = useNavigate()
	const [category, setCategory] = useState<categoryType>("match")
	const [gameInfosView, setGameInfosView] = useState<gameInfosViewType>("logs")
	const [joinedMatch, setJoinedMatch] = useState<Matchs>()
	const [selectedTarget, setSelectedTarget] = useState(0)
	const [waterView, setWaterView] = useState<"attack" | "my waters">("attack")
	const [placedShips, setPlacedShips] = useState<Ship[]>([])
	const [draggingShip, setDraggingShip] = useState<ShipName | null>(null)
	const [rotation, setRotation] = useState<shipRotation>(0)
	const [targetLocked, setTargetLocked] = useState<vect2>({ x: -1, y: -1 })
	const [turnEndsAt, setTurnEndsAt] = useState(0)
	const [remaining, setRemaining] = useState(0)
	const shipsRequest = useRef<Promise<unknown>>(Promise.resolve())
	const [errors, setErrors] = useState<{ action?: string }>({})
	const [isLoading, setIsLoading] = useState(true)
	const [hasUnreadMessage, setHasUnreadMessage] = useState(false)
	const [sendInput, setSendInput] = useState("")

	function updatePlacedShips(ships: Ship[]) {
		setPlacedShips(ships)

		shipsRequest.current = shipsRequest.current.then(async () => {
			try {
				const { ok, data } = await apiPost("/api/set-player-ships", { ships: ships.map(s => ({ name: s.name, size: s.size, start: s.start, end: s.end })) })
				if (!ok)
					console.log("set player ships:", data.code)
			} catch (error) {
				console.error("set player ships:", error)
			}
		})
	}

	async function setReady() {
		await shipsRequest.current
		try {
			const { ok, data } = await apiPost("/api/set-player-ready-on-select")
			if (!ok)
				console.log("set player ready:", data.code)
		} catch (error) {
			console.error("set player ready:", error)
		}
	}

	useEffect(() => {
		function onRefreshMatch(payload: Matchs | undefined) {
			setJoinedMatch(payload)
			setCategory(payload?.step === "game" ? "match" : "select")
			if (payload && payload.step === "deploy") {
				const myTeam = payload.players.find(p => p.userId === session?.user.id)?.team
				setPlacedShips(payload.teams.find(t => t.id === myTeam)?.ships ?? [])
			}
		}
		function onRefreshMatchChat(payload: Matchs | undefined) {
			setJoinedMatch(payload)
			setCategory(payload?.step === "game" ? "match" : "select")
			if (gameInfosView !== "chat")
				setHasUnreadMessage(true)
		}
		function onTurnUpdate(payload: { remaining: number }) {
			setTurnEndsAt(Date.now() + payload.remaining * 1000)
			setRemaining(payload.remaining)
		}

		socket.on("refresh_joined_match", onRefreshMatch)
		socket.on("refresh_chat_match", onRefreshMatchChat)
		socket.on("turn_update", onTurnUpdate)

		return () => {
			socket.off("refresh_joined_match", onRefreshMatch)
			socket.off("refresh_chat_match", onRefreshMatchChat)
			socket.off("turn_update", onTurnUpdate)
		}
	}, [socket, joinedMatch, session, gameInfosView])

	useEffect(() => {
		if (!turnEndsAt)
			return

		const id = setInterval(() => {
			setRemaining(Math.max(0, Math.ceil((turnEndsAt - Date.now()) / 1000)))
		}, 1000)

		return () => clearInterval(id)
	}, [turnEndsAt])

	useEffect(() => {
		const userId = session?.user.id
		if (!userId)
			return

		let cancelled = false

		async function loadJoinedMatch() {
			try {
				const { ok, data } = await apiPost("/api/get-joined-match")

				if (!ok || cancelled)
					return

				const match: Matchs | undefined = data.match ?? undefined
				setJoinedMatch(match)

				const myTeam = match?.players.find(p => p.userId === userId)?.team

				setSelectedTarget(match?.players.find(p => p.team !== myTeam)?.team ?? 0)

				setCategory(match?.step === "game" ? "match" : "select")

				if (match?.step === "deploy")
					setPlacedShips(match.teams.find(t => t.id === myTeam)?.ships ?? [])

				if (data.remaining > 0)
					setTurnEndsAt(Date.now() + data.remaining * 1000)
			} catch (error) {
				console.error("load joined match:", error)
			} finally {
				if (!cancelled)
					setIsLoading(false)
			}
		}

		loadJoinedMatch()
		return () => {
			cancelled = true
		}
	}, [session?.user.id])

	async function handleFire() {
		if (targetLocked.x < 0 && targetLocked.y < 0)
			return

		try {
			setErrors({})
			const { ok, data } = await apiPost("/api/player-fire", {
				hostId: joinedMatch?.hostId,
				coords: targetLocked,
				targetTeamId: selectedTarget
			})

			setTargetLocked({ x: -1, y: -1 })
			if (!ok)
				return setErrors({ action: data.code })
		} catch (error) {
			console.error("fire:", error)
		}
	}

	async function handleForfeit() {
		try {
			const { ok, data } = await apiPost("/api/forfeit-match", { hostId: joinedMatch?.hostId })

			if (!ok)
				return console.log(data.code)

			HideModal("forfeitModal")
			navigate("/play")
		} catch (error) {
			console.error("forfeit:", error)
		}
	}

	async function handleSpecLeave() {
		try {
			const { ok, data } = await apiPost("/api/leave-spec-match", { hostId: joinedMatch?.hostId })

			if (!ok)
				return console.log(data.code)

			navigate("/play")
		} catch (error) {
			console.error("leave spec match:", error)
		}
	}

	async function handleSend() {
		if (!joinedMatch)
			return

		const message = sendInput.trim()
		if (!message)
			return

		if (message.length > 1000)
			return
		// return setErrors({ messages: t("friend_err_msg_to_long") })

		try {
			setErrors({})
			const { ok, data } = await apiPost("/api/match-send-message", {
				hostId: joinedMatch.hostId,
				message
			})

			if (!ok)
				return setErrors({ action: data.code })

			setSendInput("")
		} catch (error) {
			console.error("send message:", error)
		}
	}

	if (isLoading || isPending)
		return <p>{t("sidebar_loading")}</p>

	if (!joinedMatch || joinedMatch.startedAt === 0)
		return <Navigate to="/play" replace />

	const isLocked = joinedMatch.players.find(p => p.userId === session?.user.id)?.isReady ?? false
	const isSpec = isSpectator(joinedMatch, session?.user.id)

	return <div className="h-dvh flex flex-col overflow-hidden">
		{category === "select" && joinedMatch.endedAt === 0 && <>
			<MatchHeader title={t("select_header_title")} description={t("select_header_desc")} remaining={remaining} isMyTurn={true} openForfeitModal={() => ShowModal("forfeitModal")} myId={session?.user.id} match={joinedMatch} handleSpecLeave={handleSpecLeave} />
			{!isSpec && <div className="flex flex-1 min-h-0">
				<DeploymentInfos match={joinedMatch} myId={session?.user.id} />
				<Deployment placedShips={placedShips} setPlacedShips={updatePlacedShips} draggingShip={draggingShip} setDraggingShip={setDraggingShip} rotation={rotation} setRotation={setRotation} isLocked={isLocked} />
				<Dock placedShips={placedShips} setPlacedShips={updatePlacedShips} draggingShip={draggingShip} setDraggingShip={setDraggingShip} rotation={rotation} setRotation={setRotation} isLocked={isLocked} onReady={setReady} />
			</div>}
			{!isSpec && <DeploymentFooter placedShips={placedShips} isLocked={isLocked} onReady={setReady} />}
			{isSpec && <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
				<div className="flex flex-col min-h-full items-center justify-center">
					<div className="border border-neutral border-dashed rounded-xl p-4 bg-neutral/15 flex flex-col items-center gap-2">
						<span className="border rounded-full p-3 text-neutral"><IoIosBoat className="size-5" /></span>
						<h1 className="font-bold first-letter:uppercase">{t("match_players_placing")}</h1>
						<p className="text-neutral-content/50 first-letter:uppercase">{t("match_wait")}..</p>
					</div>
				</div>
			</div>}
		</>}

		{category === "match" && joinedMatch.endedAt === 0 && <>
			<MatchHeader type={joinedMatch.type} title={joinedMatch.isRanked ? t("txt_ranked") : t("txt_unranked")} description={t("match_your_turn")} remaining={remaining} isMyTurn={joinedMatch.turns.userTurn === session?.user.id} openForfeitModal={() => ShowModal("forfeitModal")} myId={session?.user.id} match={joinedMatch} handleSpecLeave={handleSpecLeave} />
			<div className="flex flex-1 min-h-0 min-w-0">
				<GameStats match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
				<Game match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} waterView={waterView} setWaterView={setWaterView} targetLocked={targetLocked} setTargetLocked={setTargetLocked} handleFire={handleFire} errorMsg={errors.action ?? ""} hasUnreadMessage={hasUnreadMessage} gameInfosView={gameInfosView} setGameInfosView={setGameInfosView} setHasUnreadMessage={setHasUnreadMessage} sendInput={sendInput} setSendInput={setSendInput} handleSend={handleSend} />
				<GameInfos match={joinedMatch} myId={session?.user.id} hasUnreadMessage={hasUnreadMessage} gameInfosView={gameInfosView} setGameInfosView={setGameInfosView} setHasUnreadMessage={setHasUnreadMessage} sendInput={sendInput} setSendInput={setSendInput} handleSend={handleSend} />
			</div>
		</>}

		{joinedMatch.endedAt !== 0 && !isSpectator(joinedMatch, session?.user.id) && <EndDisplay match={joinedMatch} />}
		{joinedMatch.endedAt !== 0 && isSpectator(joinedMatch, session?.user.id) && <EndSpecDisplay match={joinedMatch} />}

		<Modal id="forfeitModal">
			<p className="pb-2 first-letter:uppercase">{t("match_forfeit")}</p>
			<p>{t("match_forfeit_desc")}</p>
			<div className="flex gap-2 pt-2 justify-end">
				<button onClick={() => HideModal("forfeitModal")} className="btn btn-neutral">{t("btn_cancel")}</button>
				<button className="btn btn-error btn-outline" onClick={handleForfeit}>{t("btn_confirm")}</button>
			</div>
		</Modal>
	</div>
}