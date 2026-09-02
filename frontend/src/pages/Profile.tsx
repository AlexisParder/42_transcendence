import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";

export function Profile() {
	return <Sidebar>
		<p>{t("profile_title")}</p>
	</Sidebar>
}