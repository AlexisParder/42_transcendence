import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { CenterSide, LeftSide, MatchHeader, RightSide } from "./matchUtils";

export function Match() {
	useDocumentTitle("Match")

	return <div>
		<MatchHeader />
		<div className="flex">
			<LeftSide />
			<CenterSide />
			<RightSide />
		</div>
	</div>
}