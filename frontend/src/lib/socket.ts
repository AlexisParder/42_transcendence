import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from "../../../backend/src/events.ts"

/**
 * Socket<Events reçus, Events émis>
 */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000", {
	withCredentials: true,
	autoConnect: false
})

socket.on("connect", () => {
	// console.log("Connecté au serveur, id: ", socket.id)
})

socket.on("connect_error", (err) => {
	console.log("Connection error: ", err.message)
})