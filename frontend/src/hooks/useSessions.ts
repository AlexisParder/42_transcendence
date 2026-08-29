import { useCallback, useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";

export type SessionRow = typeof authClient.$Infer.Session["session"]
export function useSessions() {
	const [sessions, setSessions] = useState<SessionRow[]>([])

	const refresh = useCallback(() => {
		authClient.listSessions().then(({ data }) => {
			if (data)
				setSessions(data)
		})
	}, [])

	useEffect(() => {
		refresh()
	}, [refresh])

	async function revokeSession(token: string, id: string) {
		const { error } = await authClient.revokeSession({ token })

		if (error)
			return

		setSessions(prev => prev.filter(x => x.id !== id))
	}

	async function revokeOthers() {
		const { error } = await authClient.revokeOtherSessions()

		if (error)
			return

		refresh()
	}

	return { sessions, revokeSession, revokeOthers }
}