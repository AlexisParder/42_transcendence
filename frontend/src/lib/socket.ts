import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events"

/**
 * Socket<Events reçus, Events émis>
 */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
	withCredentials: true,
	autoConnect: false
})

socket.on("connect_error", (err) => {
	console.error("Connection error: ", err.message)
})