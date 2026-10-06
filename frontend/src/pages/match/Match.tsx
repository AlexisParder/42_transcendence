import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { CenterSide, LeftSide, MatchHeader, RightSide } from "./matchUtils";

export function Match() {
	useDocumentTitle("Match")

	return <div className="h-dvh flex flex-col overflow-hidden">
		<MatchHeader />
		<div className="flex flex-1 min-h-0">
			<LeftSide />
			<CenterSide />
			<RightSide />
		</div>
	</div>
}