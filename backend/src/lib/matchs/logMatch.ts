import type { Server } from "socket.io";
import type { ClientToServerEvents, Log, Matchs, ServerToClientEvents, SocketData } from "../../events.ts";
import { filterMatchForUser } from "./matchUtils.ts";

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

export function addLog(match: Matchs, log: Log, io: IO, emitSocket: boolean) {
	match.logs.push(log);

	if (emitSocket) {
		for (const player of match.players) {
			if (player.userId && player.status !== "LEFT")
				io.to(player.userId).emit("refresh_joined_match", filterMatchForUser(match, player.userId))
		}
		for (const spectator of match.spectators) {
			if (spectator)
				io.to(spectator).emit("refresh_joined_match", filterMatchForUser(match, spectator))
		}
	}
}