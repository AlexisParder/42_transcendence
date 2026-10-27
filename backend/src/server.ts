import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "./events.ts"

export const allowedOrigins = (process.env.CORS_ORIGIN ?? "").split(",")

export const app = express()
export const server = createServer(app)
export const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
	cors: {
		origin: allowedOrigins,
		credentials: true
	}
})
