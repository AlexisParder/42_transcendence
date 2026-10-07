import { useEffect, useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Game, GameStats, MatchHeader, GameInfos } from "./matchUtils";
import type { Matchs, matchType } from "../../types/events";
import { useSocket } from "../../components/socketContext";
import { authClient } from "../../lib/auth-client";
import { apiPost } from "../../lib/api";

type categoryType = "select" | "match"
export function Match() {
	useDocumentTitle("Match")

	const { data: session } = authClient.useSession()
	const socket = useSocket()
	const [category, setCategory] = useState<categoryType>("match")
	const [joinedMatch, setJoinedMatch] = useState<Matchs>()

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

				const match = data.match ?? undefined
				setJoinedMatch(match)
			} catch (error) {
				console.error("load joined match:", error)
			}
		}

		loadJoinedMatch()
	}, [session?.user])

	if (!joinedMatch) // a changer plus tard
		return

	return <div className="h-dvh flex flex-col overflow-hidden">
		{category === "select" && <>
			<MatchHeader title="DEPLOYMENT" description="Place your fleet" />
			<div className="flex flex-1 min-h-0">
				{/* <LeftSide /> */}
				{/* <CenterSide /> */}
				{/* <RightSide /> */}
			</div>
		</>}

		{category === "match" && <>
			<MatchHeader type={joinedMatch.type} title="Ranked" description="Your turn" />
			<div className="flex flex-1 min-h-0 min-w-0">
				<GameStats type={joinedMatch.type} />
				<Game type={joinedMatch.type} />
				<GameInfos type={joinedMatch.type} />
			</div>
		</>}
	</div>
}