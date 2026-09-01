import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";

export function Play() {
	return <Sidebar>
		<p>{t("play_title")}</p>
	</Sidebar>
}