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
import { EndDisplay } from "./endUtils";
import { HideModal, Modal, ShowModal } from "../../components/Modal";
import { data } from "react-router-dom";

type categoryType = "select" | "match"
export function Match() {
	useDocumentTitle(t("match_title"))

	const { data: session } = authClient.useSession()
	const socket = useSocket()
	const [category, setCategory] = useState<categoryType>("match")
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
		}
		function onTurnUpdate(payload: { remaining: number }) {
			setTurnEndsAt(Date.now() + payload.remaining * 1000)
			setRemaining(payload.remaining)
		}

		socket.on("refresh_joined_match", onRefreshMatch)
		socket.on("turn_update", onTurnUpdate)

		return () => {
			socket.off("refresh_joined_match", onRefreshMatch)
			socket.off("turn_update", onTurnUpdate)
		}
	}, [socket])

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
			const { ok, data } = await apiPost("/api/player-fire", {
				hostId: joinedMatch?.hostId,
				coords: targetLocked,
				targetTeamId: selectedTarget
			})

			setTargetLocked({ x: -1, y: -1 })
			if (!ok)
				return console.log(data.code)

			const match: Matchs | undefined = data.match ?? undefined
			setJoinedMatch(match)
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
		} catch (error) {
			console.error("forfeit:", error)
		}
	}

	if (!joinedMatch || joinedMatch.startedAt === 0)
		return

	const isLocked = joinedMatch.players.find(p => p.userId === session?.user.id)?.isReady ?? false

	return <div className="h-dvh flex flex-col overflow-hidden">
		{category === "select" && joinedMatch.endedAt === 0 && <>
			<MatchHeader title={t("select_header_title")} description={t("select_header_desc")} remaining={remaining} isMyTurn={true} openForfeitModal={() => ShowModal("forfeitModal")} />
			<div className="flex flex-1 min-h-0">
				<DeploymentInfos match={joinedMatch} myId={session?.user.id} />
				<Deployment placedShips={placedShips} setPlacedShips={updatePlacedShips} draggingShip={draggingShip} setDraggingShip={setDraggingShip} rotation={rotation} setRotation={setRotation} isLocked={isLocked} />
				<Dock placedShips={placedShips} setPlacedShips={updatePlacedShips} draggingShip={draggingShip} setDraggingShip={setDraggingShip} rotation={rotation} setRotation={setRotation} isLocked={isLocked} onReady={setReady} />
			</div>
			<DeploymentFooter placedShips={placedShips} isLocked={isLocked} onReady={setReady} />
		</>}

		{category === "match" && joinedMatch.endedAt === 0 && <>
			<MatchHeader type={joinedMatch.type} title={joinedMatch.isRanked ? t("txt_ranked") : t("txt_unranked")} description={t("match_your_turn")} remaining={remaining} isMyTurn={joinedMatch.turns.userTurn === session?.user.id} openForfeitModal={() => ShowModal("forfeitModal")} />
			<div className="flex flex-1 min-h-0 min-w-0">
				<GameStats match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
				<Game match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} waterView={waterView} setWaterView={setWaterView} targetLocked={targetLocked} setTargetLocked={setTargetLocked} handleFire={handleFire} />
				<GameInfos match={joinedMatch} myId={session?.user.id} />
			</div>
		</>}

		{joinedMatch.endedAt !== 0 && <>
			<EndDisplay match={joinedMatch} />
		</>}

		<Modal id="forfeitModal">
			<p className="pb-2 first-letter:uppercase">{t("match_forfeit")}</p>
			<p>This action is irreversible and will result in a loss of points</p>
			<div className="flex gap-2 pt-2 justify-end">
				<button onClick={() => HideModal("forfeitModal")} className="btn btn-neutral">{t("btn_cancel")}</button>
				<button className="btn btn-error btn-outline" onClick={handleForfeit}>{t("btn_confirm")}</button>
			</div>
		</Modal>
	</div>
}