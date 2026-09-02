import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";

export function Tournaments() {
	return <Sidebar>
		<p>{t("tournaments_title")}</p>
	</Sidebar>
}