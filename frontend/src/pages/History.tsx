import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";

export function History() {
	return <Sidebar>
		<p>{t("history_title")}</p>
	</Sidebar>
}