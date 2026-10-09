import { useEffect, useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Game, GameStats, MatchHeader, GameInfos } from "./matchUtils";
import { Deployment, DeploymentInfos, Dock } from "./selectUtils";
import type { Matchs, Ship, ShipName, shipRotation, vect2 } from "../../types/events";
import { useSocket } from "../../components/socketContext";
import { authClient } from "../../lib/auth-client";
import { apiPost } from "../../lib/api";
import { t } from "../../lib/translate";

type categoryType = "select" | "match"
export function Match() {
	useDocumentTitle("Match")

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

	useEffect(() => {
		function onRefreshMatch(payload: Matchs | undefined) {
			setJoinedMatch(payload)
		}

		socket.on("refresh_joined_match", onRefreshMatch)

		return () => {
			socket.off("refresh_joined_match", onRefreshMatch)
		}
	}, [socket])

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

	if (!joinedMatch)
		return

	return <div className="h-dvh flex flex-col overflow-hidden">
		{category === "select" && <>
			<MatchHeader title="deployment" description="Place your fleet" />
			<div className="flex flex-1 min-h-0">
				<DeploymentInfos match={joinedMatch} myId={session?.user.id} />
				<Deployment placedShips={placedShips} setPlacedShips={setPlacedShips} draggingShip={draggingShip} setDraggingShip={setDraggingShip} rotation={rotation} setRotation={setRotation} />
				<Dock placedShips={placedShips} setPlacedShips={setPlacedShips} draggingShip={draggingShip} setDraggingShip={setDraggingShip} rotation={rotation} setRotation={setRotation} />
			</div>
		</>}

		{category === "match" && <>
			<MatchHeader type={joinedMatch.type} title={joinedMatch.isRanked ? t("txt_ranked") : t("txt_unranked")} description="Your turn" />
			<div className="flex flex-1 min-h-0 min-w-0">
				<GameStats match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
				<Game match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} waterView={waterView} setWaterView={setWaterView} targetLocked={targetLocked} setTargetLocked={setTargetLocked} handleFire={handleFire} />
				<GameInfos match={joinedMatch} myId={session?.user.id} />
			</div>
		</>}
	</div>
}