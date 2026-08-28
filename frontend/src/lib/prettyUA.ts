export function prettyUA(ua?: string | null) {
	if (!ua) return "Unknown device"

	const browser = ua.includes("Firefox") ? "Firefox"
		: ua.includes("Edg") ? "Edge"
		: ua.includes("Chrome") ? "Chrome"
		: ua.includes("Safari") ? "Safari"
		: "Unknown"

	const os = ua.includes("Windows") ? "Windows"
		: ua.includes("Mac") ? "macOs"
		: ua.includes("Linux") ? "Linux"
		: ua.includes("Android") ? "Android"
		: ua.includes("iPhone") ? "iOS"
		: "Unknown"

	return `${browser} - ${os}`
}