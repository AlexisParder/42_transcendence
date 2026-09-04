export function Avatar({ username, image, size, status = null }: { username: string | null | undefined, image: string | null | undefined, size: number, status?: null | "available" | "away" | "offline" | "in a match" }) {
	if (size < 4)
		size = 4

	let statusColor = ""
	if (status !== null) {
		if (status === "available")
			statusColor = "info"
		else if (status === "away")
			statusColor = "warning"
		else if (status === "in a match")
			statusColor = "error"
		else
			statusColor = "neutral"
	}

	if (image && image?.length > 5)
		return <div className="indicator">
			{status !== null && <span className={`indicator-item indicator-bottom status status-${statusColor}`}></span>}
			<div className="grid place-items-center">
				<img src={image} alt="Profile picture" className={`rounded-md w-${size / 4} h-${size / 4} object-cover shrink-0`} />
			</div>
		</div>
	return <div className="indicator">
		{status !== null && <span className={`indicator-item indicator-bottom status status-${statusColor}`}></span>}
		<div className="grid place-items-center">
			<div className={`flex rounded-md w-${size / 4} h-${size / 4} shrink-0 bg-info/15 border border-info/50`}>
				<p className={`flex flex-1 justify-center items-center font-bold text-lg`}>{username && username.length > 0 ? username.charAt(0).toUpperCase() : '-'}</p>
			</div>
		</div>
	</div>
}