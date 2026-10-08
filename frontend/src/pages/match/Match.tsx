import { useEffect, useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Game, GameStats, MatchHeader, GameInfos } from "./matchUtils";
import { Deployment, DeploymentInfos, Dock } from "./selectUtils";
import type { Matchs, ShipName, vect2 } from "../../types/events";
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
	const [selectedTarget, setSelectedTarget] = useState("")
	const [waterView, setWaterView] = useState<"attack" | "my waters">("attack")
	const [placedShips, setPlacedShips] = useState<ShipName[]>([])
	const [draggingShip, setDraggingShip] = useState<ShipName | null>(null)
	const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal")
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
		async function loadJoinedMatch() {
			try {
				const { ok, data } = await apiPost("/api/get-joined-match")

				if (!ok)
					return

				const match: Matchs | undefined = data.match ?? undefined
				setJoinedMatch(match)
				setSelectedTarget(match?.players.find(p => p.userId !== session?.user.id)?.userId ?? "")
			} catch (error) {
				console.error("load joined match:", error)
			}
		}

		loadJoinedMatch()
	}, [session?.user])

	if (!joinedMatch)
		return

	return <div className="h-dvh flex flex-col overflow-hidden">
		{category === "select" && <>
			<MatchHeader title="deployment" description="Place your fleet" />
			<div className="flex flex-1 min-h-0">
				<DeploymentInfos match={joinedMatch} myId={session?.user.id} />
				<Deployment />
				<Dock placedShips={placedShips} setPlacedShips={setPlacedShips} draggingShip={draggingShip} setDraggingShip={setDraggingShip} orientation={orientation} setOrientation={setOrientation} />
			</div>
		</>}

		{category === "match" && <>
			<MatchHeader type={joinedMatch.type} title={joinedMatch.isRanked ? t("txt_ranked") : t("txt_unranked")} description="Your turn" />
			<div className="flex flex-1 min-h-0 min-w-0">
				<GameStats match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
				<Game match={joinedMatch} myId={session?.user.id} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} waterView={waterView} setWaterView={setWaterView} targetLocked={targetLocked} setTargetLocked={setTargetLocked} />
				<GameInfos match={joinedMatch} myId={session?.user.id} />
			</div>
		</>}
	</div>
}