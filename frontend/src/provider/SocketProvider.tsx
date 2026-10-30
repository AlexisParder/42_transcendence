import React, { useEffect } from "react";
import { socket } from "../lib/socket";
import { authClient } from "../lib/auth-client";
import { SocketContext } from "../components/socketContext";
import type { PresenceStatus } from "../types/events";

export function SocketProvider({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = authClient.useSession()
	const userId = session?.user.id

	useEffect(() => {
		if (isPending)
			return

		if (userId) {
			if (!socket.connected)
				socket.connect()
		} else {
			if (socket.connected)
				socket.disconnect()
		}
	}, [userId, isPending])

	useEffect(() => {
		if (!userId)
			return

		const AWAY_DELAY = 5 * 60 * 1000
		let timer: ReturnType<typeof setTimeout>
		let currentStatus: PresenceStatus = "available"

		function goAway() {
			if (currentStatus === "away")
				return
			currentStatus = "away"
			socket.emit("set_activity", { status: "away" })
		}

		function goAvailable() {
			if (currentStatus === "available")
				return
			currentStatus = "available"
			socket.emit("set_activity", { status: "available" })
		}

		function onActivity() {
			goAvailable()
			clearTimeout(timer)
			timer = setTimeout(goAway, AWAY_DELAY)
		}

		function onVisibility() {
			if (document.hidden)
				goAway()
			else
				onActivity()
		}

		window.addEventListener("mousemove", onActivity)
		window.addEventListener("keydown", onActivity)
		window.addEventListener("click", onActivity, true)
		document.addEventListener("visibilitychange", onVisibility)

		timer = setTimeout(goAway, AWAY_DELAY)

		return () => {
			clearTimeout(timer)
			window.removeEventListener("mousemove", onActivity)
			window.removeEventListener("keydown", onActivity)
			window.removeEventListener("click", onActivity, true)
			document.removeEventListener("visibilitychange", onVisibility)
		}
	}, [userId])

	return <>
		<SocketContext.Provider value={socket}>
			{children}
		</SocketContext.Provider>
	</>
}