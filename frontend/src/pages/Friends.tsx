import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";

export function Friends() {
	return <Sidebar>
		<p>{t("friends_title")}</p>
	</Sidebar>
}