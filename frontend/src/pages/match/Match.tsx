import { useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { CenterSide, LeftSide, MatchHeader, RightSide } from "./matchUtils";

type categoryType = "select" | "match"
export function Match() {
	useDocumentTitle("Match")

	const [category, setCategory] = useState<categoryType>("select")

	return <div className="h-dvh flex flex-col overflow-hidden">
		{category === "select" && <>
			{/* <MatchHeader />
			<div className="flex flex-1 min-h-0">
				<LeftSide />
				<CenterSide />
				<RightSide />
			</div> */}
		</>}

		{category === "match" && <>
			<MatchHeader />
			<div className="flex flex-1 min-h-0">
				<LeftSide />
				<CenterSide />
				<RightSide />
			</div>
		</>}
	</div>
}