import type { NotificationPreferences } from "../../hooks/useNotificationPreferences"
import { Togglebox } from "../../components/Togglebox"
import { t } from "../../lib/translate"

export function NotifLine({ title, desc, inputName, controls }: {
	title: string, desc: string, inputName: string,
	controls: {
		preferences: NotificationPreferences | null
		disabled: boolean
		onChange: (key: keyof NotificationPreferences, value: boolean) => Promise<void>
	}
}) {
	return <tr>
		<th>
			<p>{title}</p>
			<p className="text-xs text-neutral-content/40">{desc}</p>
		</th>
		<td>
			<Togglebox name={`app_${inputName}`} type="info" aria-label={`${title} - ${t("settings_notif_lbl_app")}`}
				checked={controls.preferences?.[`app_${inputName}` as keyof NotificationPreferences] ?? false}
				disabled={controls.disabled}
				onChange={event => controls.onChange(`app_${inputName}` as keyof NotificationPreferences, event.target.checked)} />
		</td>
		<td>
			<Togglebox name={`email_${inputName}`} type="info" aria-label={`${title} - ${t("txt_email")}`}
				checked={controls.preferences?.[`email_${inputName}` as keyof NotificationPreferences] ?? false}
				disabled={controls.disabled}
				onChange={event => controls.onChange(`email_${inputName}` as keyof NotificationPreferences, event.target.checked)} />
		</td>
	</tr>
}