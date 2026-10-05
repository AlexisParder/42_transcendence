import { Sidebar } from "../../components/Sidebar"
import { useState } from "react"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { SettingsNotif } from "./Notifications"
import { t } from "../../lib/translate"
import { SettingsCat } from "./Accounts"

type SettingsCategory = "account" | "notifications"
export function Settings() {
	useDocumentTitle(t("settings_title"))
	const [category, setCategory] = useState<SettingsCategory>('account')

	return <Sidebar>
		<div className="p-4">
			<h1 className="text-xl font-bold">{category === "account" ? t("settings_title") : t("settings_notif_title")}</h1>
			<p className="text-sm text-neutral-content/40">{category === "account" ? t("settings_desc") : t("settings_notif_desc")}.</p>

			<div className="join mt-4">
				<input className="join-item btn" type="radio" defaultChecked={category === "account"} name="options" onClick={() => {
					if (category !== "account")
						setCategory("account")
				}} aria-label={t("settings_acc_title")} />
				<input className="join-item btn" type="radio" defaultChecked={category === "notifications"} name="options" onClick={() => {
					if (category !== "notifications")
						setCategory("notifications")
				}} aria-label={t("settings_notif_title")} />
			</div>
			<div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>

			{category === "account" && <SettingsCat />}
			{category === "notifications" && <SettingsNotif />}
		</div>
	</Sidebar>
}