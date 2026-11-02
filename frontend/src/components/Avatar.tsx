import type { PresenceStatus } from "../types/events"
import { t } from "../lib/translate"

const StatusType: Record<string, string> = {
	available: "status-info",
	away: "status-warning",
	"in a match": "status-error",
	offline: "status-neutral"
}

export function Avatar({ username, image, size, status = null }: { username: string | null | undefined, image: string | null | undefined, size: number, status?: null | PresenceStatus }) {
	if (size < 4)
		size = 4

	const hasImg = image && image.length > 5

	return <>
		<div className="indicator">
			{status !== null && <span className={`indicator-item indicator-bottom status ${StatusType[status]}`}></span>}
			<div className="grid place-items-center">
				{hasImg ? (
					<img src={image} alt={t("txt_profile_picture")} className={`rounded-md object-cover shrink-0`} style={{ width: size, height: size }} referrerPolicy="no-referrer" />
				) : (
					<div className={`flex rounded-md shrink-0 bg-info/15 border border-info/50`} style={{ width: size, height: size }}>
						<p className={`flex flex-1 justify-center items-center font-bold leading-none`} style={{ fontSize: size * 0.5 }}>{username && username.length > 0 ? username.charAt(0).toUpperCase() : '?'}</p>
					</div>
				)}
			</div>
		</div>
	</>
}