import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";

export function Leaderboard() {
	return <Sidebar>
		<p>{t("leaderboard_title")}</p>
	</Sidebar>
}