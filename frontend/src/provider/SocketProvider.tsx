import React, { useEffect } from "react";
import { socket } from "../lib/socket";
import { authClient } from "../lib/auth-client";
import { SocketContext } from "../components/socketContext";


export function SocketProvider({children}: {children: React.ReactNode}) {
	const {data: session, isPending} = authClient.useSession()
	const userId = session?.user.id

	useEffect(() => {
		if (isPending)
			return

		if (userId)
		{
			if (!socket.connected)
				socket.connect()
		} else {
			if (socket.connected)
				socket.disconnect()
		}
	}, [userId, isPending])

	return <>
		<SocketContext.Provider value={socket}>
			{children}
		</SocketContext.Provider>
	</>
}