import { authClient } from "../../lib/auth-client"
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences"
import { NotifLine } from "./NotifLine"
import { t } from "../../lib/translate"

export function SettingsNotif() {
	const { data: session } = authClient.useSession()
	const { preferences, saving, saved, error, update } = useNotificationPreferences(session?.user.id)
	const controls = { preferences, disabled: saving || !preferences, onChange: update }
	return <div className="max-w-200">
		<p className="mb-3 text-sm text-base-content/60">{t("settings_notif_help")}</p>
		<p role="status" className="mb-3 text-sm">{error || (saving ? t("settings_notif_saving") : saved ? t("settings_notif_saved") : !preferences ? t("settings_notif_loading") : "")}</p>
		<div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
		<table className="table">
			<thead>
				<tr>
					<th>{t("settings_notif_lbl_event").toUpperCase()}</th>
					<th>{t("settings_notif_lbl_app").toUpperCase()}</th>
					<th>{t("txt_email").toUpperCase()}</th>
				</tr>
			</thead>
			<tbody>
				<NotifLine title={t("settings_notif_title_3")} desc={t("settings_notif_desc_3")} inputName="friend" controls={controls} />
				<NotifLine title={t("settings_notif_title_4")} desc={t("settings_notif_desc_4")} inputName="chat" controls={controls} />
				<NotifLine title={t("settings_notif_title_7")} desc={t("settings_notif_desc_7")} inputName="achievements" />
				<NotifLine title={t("settings_notif_title_8")} desc={t("settings_notif_desc_8")} inputName="security" />
			</tbody>
		</table>
		</div>
	</div>
}