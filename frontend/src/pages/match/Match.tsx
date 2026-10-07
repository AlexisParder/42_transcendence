import { useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Game, GameStats, MatchHeader, GameInfos } from "./matchUtils";
import type { matchType } from "../../types/events";

type categoryType = "select" | "match"
export function Match() {
	useDocumentTitle("Match")

	const [category, setCategory] = useState<categoryType>("match")

	const type: matchType = "FOUR_FFA"

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
			<MatchHeader type={type} title="Ranked Match" description="Your turn" />
			<div className="flex flex-1 min-h-0">
				<GameStats type={type} />
				<Game type={type} />
				<GameInfos type={type} />
			</div>
		</>}
	</div>
}